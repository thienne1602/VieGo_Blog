"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import Toast from "../../../components/common/Toast";

export default function TourDetailPage({ params }: any) {
  // Next.js app router passes params differently depending on version; support both
  const id =
    params?.id ||
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null);
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await api.getTour(id);
      if (res.success) {
        if (mounted) setTour(res.data);
      }
      setLoading(false);
    }
    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-8">Đang tải tour...</div>;
  if (!tour) return <div className="p-8">Tour không tìm thấy</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{tour.title}</h1>
          <div className="mb-6 text-neutral-700">{tour.description}</div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Lịch trình</h3>
            <pre className="bg-neutral-50 p-4 rounded">
              {JSON.stringify(tour.itinerary || {}, null, 2)}
            </pre>

            <h3 className="text-xl font-semibold">Bao gồm</h3>
            <ul className="list-disc pl-6">
              {(tour.inclusions || []).map((inc: string, i: number) => (
                <li key={i}>{inc}</li>
              ))}
            </ul>

            <h3 className="text-xl font-semibold">Không bao gồm</h3>
            <ul className="list-disc pl-6">
              {(tour.exclusions || []).map((ex: string, i: number) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-primary mb-2">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: tour.currency || "VND",
            }).format(tour.price_per_person || tour.price)}
          </div>
          <div className="text-sm text-neutral-500 mb-4">
            /người · Tối đa {tour.max_participants || 10} người
          </div>

          <div className="mb-4">
            <BookingForm tour={tour} />
          </div>

          <div className="text-sm text-neutral-600">
            <div>Điểm xuất phát: {tour.starting_location}</div>
            <div>Thời lượng: {tour.duration_days || tour.duration} ngày</div>
            <div>Trình độ: {tour.difficulty_level || tour.difficulty}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingForm({ tour }: any) {
  const [date, setDate] = useState<string>("");
  const [participants, setParticipants] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<any | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // client-side validation
      if (!date) {
        setToast({ message: "Vui lòng chọn ngày khởi hành", type: "error" });
        setLoading(false);
        return;
      }
      if (participants < (tour.min_participants || 1)) {
        setToast({
          message: `Số người tối thiểu là ${tour.min_participants || 1}`,
          type: "error",
        });
        setLoading(false);
        return;
      }

      const res = await api.post(`/tours/${tour.id}/book`, {
        date,
        participants,
      });

      if (res.success) {
        const booking = res.data?.booking || res.data;
        setToast({ message: "Đặt chỗ thành công", type: "success" });
        setMessage("Mã đặt chỗ: " + (booking?.id || "—"));
      } else {
        setToast({ message: res.error || "Lỗi khi đặt chỗ", type: "error" });
        setMessage(res.error || "Lỗi khi đặt chỗ");
      }
    } catch (err) {
      setToast({ message: "Lỗi khi đặt chỗ", type: "error" });
      setMessage("Lỗi khi đặt chỗ");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Ngày khởi hành</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Số người</label>
        <input
          type="number"
          value={participants}
          min={1}
          max={tour.max_participants || 20}
          onChange={(e) => setParticipants(Number(e.target.value))}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={loading || !date}
          className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Đặt Ngay"}
        </button>
      </div>
      {message && <div className="text-sm text-center mt-2">{message}</div>}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </form>
  );
}
