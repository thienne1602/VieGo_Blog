"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";

export default function SellerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await api.getSellerBookings();
      if (res.success && mounted) setBookings(res.data.bookings || []);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateStatus = async (bId: number, status: string) => {
    const original = bookings.slice();
    setBookings((prev) =>
      prev.map((b) => (b.id === bId ? { ...b, status } : b))
    );
    const res = await api.updateBooking(bId, { status });
    if (!res.success) {
      alert(res.error || "Lỗi cập nhật");
      setBookings(original);
    }
  };

  if (loading) return <div className="p-4">Đang tải đặt chỗ...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Đặt chỗ của tôi</h1>
      {bookings.length === 0 ? (
        <div>Chưa có đặt chỗ nào.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{b.tour?.title || "—"}</div>
                  <div className="text-sm text-neutral-600">
                    Người đặt: {b.user?.full_name || b.user?.username || "—"}
                  </div>
                  <div className="text-sm text-neutral-600">
                    Ngày: {b.date} · Người: {b.participants}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2">{b.status}</div>
                  <div className="flex gap-2">
                    {b.status !== "confirmed" && (
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded"
                        onClick={() => updateStatus(b.id, "confirmed")}
                      >
                        Xác nhận
                      </button>
                    )}
                    {b.status !== "cancelled" && (
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded"
                        onClick={() => updateStatus(b.id, "cancelled")}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
