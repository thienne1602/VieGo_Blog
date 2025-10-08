"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ApiStatus {
  status: string;
  message: string;
  version: string;
  timestamp: string;
}

interface DatabaseData {
  posts: any[];
  categories: any[];
  locations: any[];
  stats: {
    total_posts: number;
    total_categories: number;
    total_locations: number;
  };
}

const APITestPage = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [dbData, setDbData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testApiHealth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/health");
      const data = await response.json();
      setApiStatus(data);
    } catch (err) {
      console.error("API Health check failed:", err);
      setError("Cannot connect to API server");
    }
  };

  const testDatabase = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/test/database");
      const result = await response.json();

      if (result.success) {
        setDbData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Database test failed:", err);
      setError("Cannot test database connection");
    }
  };

  useEffect(() => {
    const runTests = async () => {
      setLoading(true);
      await testApiHealth();
      await testDatabase();
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-primary mx-auto mb-4"></div>
          <p className="text-blue-600">Testing API connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <motion.h1
              className="text-4xl font-bold text-primary mb-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              VieGo Blog - API Test
            </motion.h1>
          </Link>
          <p className="text-gray-600">
            Backend API & Database Integration Status
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Health Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  apiStatus ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              API Server Status
            </h2>

            {apiStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600 font-semibold">
                    {apiStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Version:</span>
                  <span>{apiStatus.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Message:</span>
                  <span>{apiStatus.message}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Timestamp:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(apiStatus.timestamp).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ API Server is not responding</p>
            )}
          </motion.div>

          {/* Database Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  dbData ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              Database Status
            </h2>

            {dbData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Posts:</span>
                  <span className="text-blue-600 font-semibold">
                    {dbData.stats.total_posts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Categories:</span>
                  <span className="text-blue-600 font-semibold">
                    {dbData.stats.total_categories}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Locations:</span>
                  <span className="text-blue-600 font-semibold">
                    {dbData.stats.total_locations}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="text-green-700 text-sm">
                    ✅ MySQL database connected successfully!
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ Database connection failed</p>
            )}
          </motion.div>
        </div>

        {/* Sample Data Preview */}
        {dbData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold mb-4">📊 Sample Data Preview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Categories</h3>
                <div className="space-y-1">
                  {dbData.categories.slice(0, 3).map((cat: any) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <span>{cat.icon}</span>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Posts */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Recent Posts
                </h3>
                <div className="space-y-1">
                  {dbData.posts.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="text-sm">
                      <div className="truncate font-medium">{post.title}</div>
                      <div className="text-gray-500 text-xs">
                        👤 {post.author_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Locations</h3>
                <div className="space-y-1">
                  {dbData.locations.slice(0, 3).map((loc: any) => (
                    <div key={loc.id} className="text-sm">
                      <div className="truncate font-medium">{loc.name}</div>
                      <div className="text-gray-500 text-xs">
                        📍 {loc.province}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* API Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">🔗 Available API Endpoints</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">
                ✅ Working Endpoints:
              </h3>
              <div className="space-y-1 font-mono text-xs bg-gray-50 p-3 rounded">
                <div>GET /api/health</div>
                <div>GET /api/test/database</div>
                <div>POST /api/auth/login</div>
                <div>GET /api/posts</div>
                <div>GET /api/posts/&lt;slug&gt;</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-blue-600">🔧 Test Links:</h3>
              <div className="space-y-2">
                <Link
                  href="/login/test-api"
                  className="block text-blue-600 hover:underline"
                >
                  → Login Test Page
                </Link>
                <Link
                  href="/blog"
                  className="block text-blue-600 hover:underline"
                >
                  → Blog Posts (API)
                </Link>
                <Link href="/" className="block text-blue-600 hover:underline">
                  → Homepage
                </Link>
                <a
                  href="http://localhost:5000/api/posts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  → Direct API (JSON)
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center space-x-4"
        >
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Tests
          </button>

          <Link
            href="/"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors inline-block"
          >
            🏠 Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default APITestPage;
