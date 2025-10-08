"use client";

import { Plus } from "lucide-react";

export default function StoriesSection() {
  const stories = [
    {
      id: 1,
      user: "Bạn",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
      isAddStory: true,
    },
    {
      id: 2,
      user: "Minh Trang",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face",
      storyImage:
        "https://images.unsplash.com/photo-1555400082-c2f3df78b8ab?w=120&h=200&fit=crop",
    },
    {
      id: 3,
      user: "Văn Nam",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face",
      storyImage:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&h=200&fit=crop",
    },
    {
      id: 4,
      user: "Thu Hương",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
      storyImage:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=200&fit=crop",
    },
    {
      id: 5,
      user: "Hoàng Anh",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face",
      storyImage:
        "https://images.unsplash.com/photo-1552832230-c0197047dc09?w=120&h=200&fit=crop",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {stories.map((story) => (
          <div
            key={story.id}
            className="relative flex-shrink-0 w-28 h-44 rounded-xl overflow-hidden cursor-pointer group"
          >
            {story.isAddStory ? (
              <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center px-2">
                  Tạo tin
                </span>
              </div>
            ) : (
              <>
                <img
                  src={story.storyImage}
                  alt={story.user}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <img
                    src={story.avatar}
                    alt={story.user}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-white text-xs font-medium truncate block">
                    {story.user}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
