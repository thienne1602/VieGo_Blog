"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  preview?: boolean;
}

const NFTGallery = ({ preview = false }: Props) => {
  const [selectedNFT, setSelectedNFT] = useState<any>(null);

  // Mock NFT data
  const nfts = [
    {
      id: 1,
      name: "Explorer Bronze",
      description: "First steps in Vietnam exploration",
      image: "/images/nfts/explorer-bronze.png",
      badge_type: "explorer",
      badge_level: "bronze",
      rarity: "common",
      unlocked: true,
      points_required: 100,
      unlock_date: "2025-09-15",
    },
    {
      id: 2,
      name: "Foodie Silver",
      description: "Tasted 10 different Vietnamese dishes",
      image: "/images/nfts/foodie-silver.png",
      badge_type: "foodie",
      badge_level: "silver",
      rarity: "uncommon",
      unlocked: true,
      points_required: 500,
      unlock_date: "2025-09-20",
    },
    {
      id: 3,
      name: "Photographer Gold",
      description: "Shared 50 stunning travel photos",
      image: "/images/nfts/photographer-gold.png",
      badge_type: "photographer",
      badge_level: "gold",
      rarity: "rare",
      unlocked: false,
      points_required: 1000,
      unlock_date: null,
    },
    {
      id: 4,
      name: "Cultural Master",
      description: "Visited 20 cultural heritage sites",
      image: "/images/nfts/cultural-master.png",
      badge_type: "cultural",
      badge_level: "platinum",
      rarity: "epic",
      unlocked: false,
      points_required: 2000,
      unlock_date: null,
    },
    {
      id: 5,
      name: "Adventure Legend",
      description: "Completed extreme adventures",
      image: "/images/nfts/adventure-legend.png",
      badge_type: "adventurer",
      badge_level: "legendary",
      rarity: "legendary",
      unlocked: false,
      points_required: 5000,
      unlock_date: null,
    },
    {
      id: 6,
      name: "Writer Elite",
      description: "Published 100 travel stories",
      image: "/images/nfts/writer-elite.png",
      badge_type: "writer",
      badge_level: "gold",
      rarity: "rare",
      unlocked: false,
      points_required: 1500,
      unlock_date: null,
    },
  ];

  const displayNFTs = preview ? nfts.slice(0, 3) : nfts;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-400 to-gray-600";
      case "uncommon":
        return "from-green-400 to-green-600";
      case "rare":
        return "from-blue-400 to-blue-600";
      case "epic":
        return "from-purple-400 to-purple-600";
      case "legendary":
        return "from-yellow-400 to-yellow-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getBadgeTypeIcon = (type: string) => {
    switch (type) {
      case "explorer":
        return "🗺️";
      case "foodie":
        return "🍜";
      case "photographer":
        return "📸";
      case "cultural":
        return "🏛️";
      case "adventurer":
        return "🏔️";
      case "writer":
        return "✍️";
      default:
        return "🏆";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!preview && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            🖼️ NFT Gallery - Bộ Sưu Tập Độc Quyền
          </h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Mở khóa và sưu tập các NFT badge độc đáo khi bạn hoàn thành các
            thành tựu du lịch và ẩm thực
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {nfts.filter((nft) => nft.unlocked).length}
          </div>
          <div className="text-sm text-neutral-600">Đã Sở Hữu</div>
        </div>
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {
              nfts.filter(
                (nft) =>
                  nft.rarity === "rare" ||
                  nft.rarity === "epic" ||
                  nft.rarity === "legendary"
              ).length
            }
          </div>
          <div className="text-sm text-neutral-600">Hiếm & Epic</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500 mb-1">
            {Math.round(
              (nfts.filter((nft) => nft.unlocked).length / nfts.length) * 100
            )}
            %
          </div>
          <div className="text-sm text-neutral-600">Hoàn Thành</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500 mb-1">
            {nfts.reduce(
              (sum, nft) => (nft.unlocked ? sum + nft.points_required : sum),
              0
            )}
          </div>
          <div className="text-sm text-neutral-600">Điểm Tích Lũy</div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="nft-grid">
        {displayNFTs.map((nft, index) => (
          <motion.div
            key={nft.id}
            className={`relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
              nft.unlocked
                ? "shadow-lg hover:shadow-2xl"
                : "opacity-60 grayscale hover:grayscale-0 hover:opacity-80"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => setSelectedNFT(nft)}
          >
            {/* Rarity Border */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(
                nft.rarity
              )} opacity-20 pointer-events-none`}
            />

            {/* Image Placeholder */}
            <div className="relative h-48 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
              <div className="text-6xl">{getBadgeTypeIcon(nft.badge_type)}</div>

              {/* Lock Overlay */}
              {!nft.unlocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-3xl mb-2">🔒</div>
                    <div className="text-sm font-medium">
                      {nft.points_required} điểm
                    </div>
                  </div>
                </div>
              )}

              {/* Rarity Badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(
                    nft.rarity
                  )}`}
                >
                  {nft.rarity.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-neutral-800">
                  {nft.name}
                </h3>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">
                    {getBadgeTypeIcon(nft.badge_type)}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      nft.badge_level === "bronze"
                        ? "bg-yellow-600"
                        : nft.badge_level === "silver"
                        ? "bg-gray-400"
                        : nft.badge_level === "gold"
                        ? "bg-yellow-500"
                        : nft.badge_level === "platinum"
                        ? "bg-gray-300"
                        : "bg-gradient-to-r from-yellow-400 to-orange-500"
                    }`}
                  />
                </div>
              </div>

              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                {nft.description}
              </p>

              {nft.unlocked ? (
                <div className="text-xs text-green-600 font-medium">
                  ✅ Mở khóa:{" "}
                  {new Date(nft.unlock_date!).toLocaleDateString("vi-VN")}
                </div>
              ) : (
                <div className="text-xs text-neutral-500">
                  Cần {nft.points_required} điểm để mở khóa
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview CTA */}
      {preview && (
        <div className="text-center mt-8">
          <motion.button
            className="btn-primary text-lg px-8 py-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Xem Toàn Bộ Bộ Sưu Tập
          </motion.button>
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedNFT(null)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">
                {getBadgeTypeIcon(selectedNFT.badge_type)}
              </div>
              <h3 className="text-xl font-bold mb-2">{selectedNFT.name}</h3>
              <p className="text-neutral-600 mb-4">{selectedNFT.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Rarity:</span>
                  <span
                    className={`font-bold ${
                      selectedNFT.rarity === "legendary"
                        ? "text-yellow-500"
                        : selectedNFT.rarity === "epic"
                        ? "text-purple-500"
                        : selectedNFT.rarity === "rare"
                        ? "text-blue-500"
                        : selectedNFT.rarity === "uncommon"
                        ? "text-green-500"
                        : "text-gray-500"
                    }`}
                  >
                    {selectedNFT.rarity.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{selectedNFT.badge_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span className="font-medium">{selectedNFT.badge_level}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNFT(null)}
                className="mt-6 btn-primary w-full"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default NFTGallery;
