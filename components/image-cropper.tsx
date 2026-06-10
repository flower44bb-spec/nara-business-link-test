"use client";

import { ImagePlus, Move, ZoomIn } from "lucide-react";
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type CropState = {
  image: HTMLImageElement;
  fileName: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export function ImageCropper({
  currentImageUrl,
  onChange,
  onProcessingChange,
  outputWidth = 1600,
  outputHeight = 900,
  imageLabel = "画像",
}: {
  currentImageUrl?: string | null;
  onChange: (file: File | null) => void;
  onProcessingChange?: (processing: boolean) => void;
  outputWidth?: number;
  outputHeight?: number;
  imageLabel?: string;
}) {
  const inputId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ pointerId: 0, x: 0, y: 0 });
  const exportIdRef = useRef(0);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!crop) return;
    drawCrop(canvasRef.current, crop, outputWidth, outputHeight);
    const exportId = exportIdRef.current + 1;
    exportIdRef.current = exportId;
    setProcessing(true);
    onProcessingChange?.(true);

    const timer = window.setTimeout(() => {
      exportCrop(canvasRef.current, crop).then((file) => {
        if (exportId !== exportIdRef.current) return;
        if (!file) {
          setError("画像の切り出しに失敗しました。");
          onChange(null);
        } else {
          onChange(file);
          setError("");
        }
        setProcessing(false);
        onProcessingChange?.(false);
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [crop, onChange, onProcessingChange, outputHeight, outputWidth]);

  function selectImage(file?: File) {
    setError("");
    onChange(null);
    onProcessingChange?.(Boolean(file));
    if (!file) {
      setCrop(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("JPEG・PNG・WebP形式の画像を選択してください。");
      setCrop(null);
      onProcessingChange?.(false);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("画像は10MB以下にしてください。");
      setCrop(null);
      onProcessingChange?.(false);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setCrop({
        image,
        fileName: file.name.replace(/\.[^.]+$/, "") || "image",
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("画像を読み込めませんでした。別の画像を選択してください。");
      onProcessingChange?.(false);
    };
    image.src = objectUrl;
  }

  function startDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!crop) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function drag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!crop || dragRef.current.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const deltaX = (event.clientX - dragRef.current.x) * (outputWidth / rect.width);
    const deltaY = (event.clientY - dragRef.current.y) * (outputHeight / rect.height);
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setCrop((current) =>
      current
        ? clampCrop({
            ...current,
            offsetX: current.offsetX + deltaX,
            offsetY: current.offsetY + deltaY,
          }, outputWidth, outputHeight)
        : current,
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current.pointerId = 0;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function changeZoom(value: number) {
    setCrop((current) =>
      current ? clampCrop({ ...current, zoom: value }, outputWidth, outputHeight) : current,
    );
  }

  return (
    <div className="image-cropper">
      <label className="image-select-button" htmlFor={inputId}>
        <ImagePlus size={17} /> 画像を選択
      </label>
      <input
        id={inputId}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => selectImage(event.target.files?.[0])}
      />
      <p className="image-help">
        JPEG・PNG・WebP、10MB以下。選択後に画像をドラッグして表示範囲を調整してください。
      </p>
      {error && <p className="inline-error">{error}</p>}
      {crop ? (
        <div className="crop-editor">
          <div className="crop-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={outputWidth}
              height={outputHeight}
              style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
              onPointerDown={startDrag}
              onPointerMove={drag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />
            <span><Move size={16} /> ドラッグして範囲を移動</span>
          </div>
          <label className="crop-zoom">
            <ZoomIn size={17} />
            拡大
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={crop.zoom}
              onChange={(event) => changeZoom(Number(event.target.value))}
            />
          </label>
          <p className={processing ? "crop-status processing" : "crop-status ready"}>
            {processing ? "表示範囲を反映しています..." : "この表示範囲が保存されます"}
          </p>
        </div>
      ) : currentImageUrl ? (
        <div className="current-business-image">
          <img src={currentImageUrl} alt={`現在の${imageLabel}`} />
          <span>現在の画像。変更する場合は新しい画像を選択してください。</span>
        </div>
      ) : null}
    </div>
  );
}

function exportCrop(canvas: HTMLCanvasElement | null, crop: CropState) {
  return new Promise<File | null>((resolve) => {
    if (!canvas) {
      resolve(null);
      return;
    }
    canvas.toBlob(
      (blob) => {
        resolve(
          blob
            ? new File([blob], `${crop.fileName}-cropped.jpg`, {
                type: "image/jpeg",
              })
            : null,
        );
      },
      "image/jpeg",
      0.88,
    );
  });
}

function clampCrop(crop: CropState, outputWidth: number, outputHeight: number) {
  const baseScale = Math.max(
    outputWidth / crop.image.naturalWidth,
    outputHeight / crop.image.naturalHeight,
  );
  const renderedWidth = crop.image.naturalWidth * baseScale * crop.zoom;
  const renderedHeight = crop.image.naturalHeight * baseScale * crop.zoom;
  const maxX = Math.max(0, (renderedWidth - outputWidth) / 2);
  const maxY = Math.max(0, (renderedHeight - outputHeight) / 2);

  return {
    ...crop,
    offsetX: Math.max(-maxX, Math.min(maxX, crop.offsetX)),
    offsetY: Math.max(-maxY, Math.min(maxY, crop.offsetY)),
  };
}

function drawCrop(
  canvas: HTMLCanvasElement | null,
  crop: CropState,
  outputWidth: number,
  outputHeight: number,
) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const next = clampCrop(crop, outputWidth, outputHeight);
  const baseScale = Math.max(
    outputWidth / next.image.naturalWidth,
    outputHeight / next.image.naturalHeight,
  );
  const scale = baseScale * next.zoom;
  const width = next.image.naturalWidth * scale;
  const height = next.image.naturalHeight * scale;

  context.clearRect(0, 0, outputWidth, outputHeight);
  context.drawImage(
    next.image,
    (outputWidth - width) / 2 + next.offsetX,
    (outputHeight - height) / 2 + next.offsetY,
    width,
    height,
  );
}
