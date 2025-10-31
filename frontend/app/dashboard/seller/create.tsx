"use client";

import { useState } from "react";
import api from "../../../lib/api";

export function CreateTourForm({ onSuccess }: any) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration_days: 1,
    starting_location: "",
    price_per_person: 0,
    category: "adventure",
  });
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileStates, setFileStates] = useState<any[]>([]); // {name, progress, status, url, error}

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, gallery_images: images };
    const res = await api.post("/tours", payload);
    if (res.success) {
      if (onSuccess) onSuccess(res.data);
      else window.location.href = "/dashboard/seller";
    } else {
      if (onSuccess) onSuccess(null, res.error || "Lỗi khi tạo tour");
      else alert(res.error || "Lỗi khi tạo tour");
    }
    setSaving(false);
  };

  const uploadFileWithProgress = (file: File, index: number) => {
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      const url = `${api.baseURL}/upload/image`;
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.onprogress = (e) => {
        const perc = e.lengthComputable
          ? Math.round((e.loaded / e.total) * 100)
          : 0;
        setFileStates((prev) => {
          const copy = [...prev];
          copy[index] = { ...(copy[index] || {}), progress: perc };
          return copy;
        });
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data && data.url) {
              setFileStates((prev) => {
                const copy = [...prev];
                copy[index] = {
                  ...(copy[index] || {}),
                  status: "done",
                  url: data.url,
                };
                return copy;
              });
              setImages((prev) => [...prev, data.url]);
            } else {
              setFileStates((prev) => {
                const copy = [...prev];
                copy[index] = {
                  ...(copy[index] || {}),
                  status: "error",
                  error: data.error || "Upload failed",
                };
                return copy;
              });
            }
          } catch (err) {
            setFileStates((prev) => {
              const copy = [...prev];
              copy[index] = {
                ...(copy[index] || {}),
                status: "error",
                error: "Invalid server response",
              };
              return copy;
            });
          }
        } else {
          setFileStates((prev) => {
            const copy = [...prev];
            copy[index] = {
              ...(copy[index] || {}),
              status: "error",
              error: `HTTP ${xhr.status}`,
            };
            return copy;
          });
        }
        resolve();
      };

      xhr.onerror = () => {
        setFileStates((prev) => {
          const copy = [...prev];
          copy[index] = {
            ...(copy[index] || {}),
            status: "error",
            error: "Network error",
          };
          return copy;
        });
        resolve();
      };

      const token = api.getToken();
      // open before setting request headers
      xhr.open("POST", url);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    // Capture current length to compute indices reliably
    const startIndex = fileStates.length;
    const initialStates = Array.from(files).map((f) => ({
      name: f.name,
      progress: 0,
      status: "uploading",
    }));
    setFileStates((prev) => [...prev, ...initialStates]);

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFileWithProgress(files[i], startIndex + i);
      } catch (e) {
        // continue with next file
      }
    }

    setUploading(false);
  };

  const retryUpload = async (fileIndex: number, fileName: string) => {
    // We can't reconstruct File object after selection; user must re-select file.
    alert("Vui lòng chọn lại file và tải lên lại.");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tạo Tour Mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Thời lượng (ngày)
            </label>
            <input
              type="number"
              value={form.duration_days}
              onChange={(e) =>
                setForm({ ...form, duration_days: Number(e.target.value) })
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Địa điểm xuất phát
            </label>
            <input
              value={form.starting_location}
              onChange={(e) =>
                setForm({ ...form, starting_location: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Giá / người
            </label>
            <input
              type="number"
              value={form.price_per_person}
              onChange={(e) =>
                setForm({ ...form, price_per_person: Number(e.target.value) })
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Danh mục</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="adventure">Phiêu Lưu</option>
            <option value="cultural">Văn Hóa</option>
            <option value="food">Ẩm Thực</option>
            <option value="nature">Thiên Nhiên</option>
            <option value="urban">Đô Thị</option>
          </select>
        </div>

        <div>
          <div className="space-y-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {fileStates.map((f, idx) => (
                <div key={idx} className="w-24">
                  <div className="h-16 w-24 bg-neutral-100 rounded overflow-hidden flex items-center justify-center">
                    {f.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} className="w-24 h-16 object-cover" />
                    ) : (
                      <div className="text-xs text-neutral-500 text-center px-1">
                        {f.name}
                      </div>
                    )}
                  </div>
                  <div className="text-xs mt-1">
                    {f.status === "uploading" && <div>{f.progress}%</div>}
                    {f.status === "done" && (
                      <div className="text-green-600">Hoàn thành</div>
                    )}
                    {f.status === "error" && (
                      <div className="text-red-600">
                        Lỗi: {f.error || "Lỗi"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {images.map((src, idx) => (
                // show existing images (already uploaded)
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`i-${idx}`}
                  src={src}
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>
            <button
              type="submit"
              className="btn-primary px-4 py-2 rounded"
              disabled={saving || uploading}
            >
              {saving
                ? "Đang lưu..."
                : uploading
                ? "Đang tải ảnh..."
                : "Tạo Tour"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateTourPage() {
  return <CreateTourForm />;
}
