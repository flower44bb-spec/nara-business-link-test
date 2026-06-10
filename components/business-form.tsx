"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ApprovalGate } from "@/components/approval-gate";
import { insertRecord, updateRecord } from "@/lib/mutations";
import { supabase } from "@/lib/supabase";
import type { BaseRecord } from "@/types";

export function BusinessForm({
  business,
}: {
  business?: BaseRecord;
}) {
  const router = useRouter();
  const { user, isApproved, isAdmin, loading: authLoading } = useAuth();
  const [name, setName] = useState(String(business?.name || business?.title || ""));
  const [category, setCategory] = useState(String(business?.category || ""));
  const [area, setArea] = useState(String(business?.area || ""));
  const [description, setDescription] = useState(String(business?.description || business?.detail || ""));
  const [services, setServices] = useState(String(business?.services || ""));
  const [needs, setNeeds] = useState(String(business?.collaboration_needs || ""));
  const [contact, setContact] = useState(String(business?.contact || ""));
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !isApproved) {
      router.push("/auth");
      return;
    }

    setSaving(true);
    setError("");
    let imageUrl = String(business?.image_url || "");

    if (image) {
      const extension = image.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(path, image, { contentType: image.type });
      if (uploadError) {
        setError(`画像をアップロードできませんでした: ${uploadError.message}`);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("business-images").getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      name,
      title: name,
      category,
      area,
      description,
      detail: description,
      content: description,
      services,
      collaboration_needs: needs,
      contact,
      image_url: imageUrl || null,
      user_id: user.id,
      approval_status: isAdmin ? business?.approval_status || "approved" : "pending",
    };
    const result = business
      ? await updateRecord("businesses", String(business.id), payload)
      : await insertRecord("businesses", payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    const saved = result.data as BaseRecord;
    router.push(`/businesses/${saved.id}?saved=1`);
    router.refresh();
  }

  if (authLoading) return <p>認証情報を確認しています...</p>;
  if (!user || !isApproved) return <ApprovalGate action="事業者の登録・編集"><span /></ApprovalGate>;

  return (
    <form onSubmit={submit}>
      {error && <p className="error">{error}</p>}
      <div className="field">
        <label htmlFor="name">事業者名 *</label>
        <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="category">業種 *</label>
        <input id="category" placeholder="例：建設業、飲食業、IT・Web" value={category} onChange={(event) => setCategory(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="area">地域 *</label>
        <input id="area" placeholder="例：奈良市" value={area} onChange={(event) => setArea(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="description">事業紹介 *</label>
        <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="services">商品・サービス・得意分野</label>
        <textarea id="services" value={services} onChange={(event) => setServices(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="needs">求めている連携</label>
        <textarea id="needs" value={needs} onChange={(event) => setNeeds(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="contact">連絡先</label>
        <input id="contact" placeholder="メールアドレス、電話番号など" value={contact} onChange={(event) => setContact(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="image"><ImagePlus size={17} /> 事業者画像</label>
        <input id="image" type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
      </div>
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={() => router.back()}>キャンセル</button>
        <button className="button" type="submit" disabled={saving}>{saving ? "保存中..." : business ? "変更を保存（再承認）" : "事業者を登録（承認申請）"}</button>
      </div>
    </form>
  );
}
