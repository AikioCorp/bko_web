"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { Laptop, Smartphone, Trash2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

export default function DevicesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/me/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDevices(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRevokeDevice = async (id: string) => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/me/devices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(devices.filter((d) => d.id !== id));
    } catch (e) {}
  };

  const handleLogoutAll = async () => {
    if (!confirm("Voulez-vous déconnecter TOUS les appareils ?")) return;

    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/auth/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = "/login";
    } catch (e) {}
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center border-b border-[#1E2638] pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Appareils Connectés</h1>
          <p className="text-xs text-gray-400">Gérez vos sessions et révoquez l'accès à tout appareil suspect</p>
        </div>

        <button
          onClick={handleLogoutAll}
          className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Déconnecter tous les appareils</span>
        </button>
      </div>

      <div className="space-y-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#E5A93C]/10 text-[#E5A93C] rounded-lg flex items-center justify-center">
                {device.deviceType === "ANDROID" || device.deviceType === "IOS" ? (
                  <Smartphone className="w-6 h-6" />
                ) : (
                  <Laptop className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{device.deviceName || device.deviceType}</h4>
                <p className="text-xs text-gray-400">Dernière activité : {new Date(device.lastActiveAt).toLocaleString("fr-FR")}</p>
              </div>
            </div>

            <button
              onClick={() => handleRevokeDevice(device.id)}
              className="text-xs text-red-400 hover:text-red-300 p-2 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
