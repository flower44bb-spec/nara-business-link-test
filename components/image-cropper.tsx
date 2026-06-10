"use client";

import { ImagePlus, Move, ZoomIn } from "lucide-react";
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const OUTPUT_WIDTH = 1600;
const OUTPUT_HEIGHT = 900;
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
}: {
  currentImageUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ pointerId: 0, x: 0, y: 0 });
  const [crop, setCrop] = useState<CropState | null>(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!crop) return;
    drawCrop(canvasRef.current, crop);
  }, [crop]);

  function selectImage(file?: File) {
    setError("");
    setApplied(false);
    onChange(null);
    if (!file) {
      setCrop(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("JPEG・PNG・WebP形式の画像を選択してください。");
      setCrop(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("画像は10MB以下にしてください。");
      setCrop(null);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setCrop({
        image,
        fileName: file.name.replace(/\.[^.]+$/, "") || "business-image",
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("画像を読み込めませんでした。別の画像を選択してください。");
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
    const deltaX = (event.clientX - dragRef.current.x) * (OUTPUT_WIDTH / rect.width);
    const deltaY = (event.clientY - dragRef.current.y) * (OUTPUT_HEIGHT / rect.height);
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setApplied(false);
    onChange(null);
    setCrop((current) =>
      current
        ? clampCrop({
            ...current,
            offsetX: current.offsetX + deltaX,
            offsetY: current.offsetY + deltaY,
          })
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
    setApplied(false);
    onChange(null);
    setCrop((current) =>
      current ? clampCrop({ ...current, zoom: value }) : current,
    );
  }

  function applyCrop() {
    const canvas = canvasRef.current;
    if (!canvas || !crop) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("画像の切り出しに失敗しました。");
          return;
        }
        onChange(
          new File([blob], `${crop.fileName}-cropped.jpg`, {
            type: "image/jpeg",
          }),
        );
        setApplied(true);
        setError("");
      },
      "image/jpeg",
      0.88,
    );
  }

  return (
    <div className="image-cropper">
      <label className="image-select-button" htmlFor="business-image-source">
        <ImagePlus size={17} /> 画像を選択
      </label>
      <input
        id="business-image-source"
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
              width={OUTPUT_WIDTH}
              height={OUTPUT_HEIGHT}
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
          <button className="button secondary" type="button" onClick={applyCrop}>
            {applied ? "この表示範囲を選択済み" : "この表示範囲を使用"}
          </button>
        </div>
      ) : currentImageUrl ? (
        <div className="current-business-image">
          <img src={currentImageUrl} alt="現在の事業者画像" />
          <span>現在の画像。変更する場合は新しい画像を選択してください。</span>
        </div>
      ) : null}
    </div>
  );
}

function clampCrop(crop: CropState) {
  const baseScale = Math.max(
    OUTPUT_WIDTH / crop.image.naturalWidth,
    OUTPUT_HEIGHT / crop.image.naturalHeight,
  );
  const renderedWidth = crop.image.naturalWidth * baseScale * crop.zoom;
  const renderedHeight = crop.image.naturalHeight * baseScale * crop.zoom;
  const maxX = Math.max(0, (renderedWidth - OUTPUT_WIDTH) / 2);
  const maxY = Math.max(0, (renderedHeight - OUTPUT_HEIGHT) / 2);

  return {
    ...crop,
    offsetX: Math.max(-maxX, Math.min(maxX, crop.offsetX)),
    offsetY: Math.max(-maxY, Math.min(maxY, crop.offsetY)),
  };
}

function drawCrop(canvas: HTMLCanvasElement | null, crop: CropState) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const next = clampCrop(crop);
  const baseScale = Math.max(
    OUTPUT_WIDTH / next.image.naturalWidth,
    OUTPUT_HEIGHT / next.image.naturalHeight,
  );
  const scale = baseScale * next.zoom;
  const width = next.image.naturalWidth * scale;
  const height = next.image.naturalHeight * scale;

  context.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  context.drawImage(
    next.image,
    (OUTPUT_WIDTH - width) / 2 + next.offsetX,
    (OUTPUT_HEIGHT - height) / 2 + next.offsetY,
    width,
    height,
  );
}
