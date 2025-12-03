import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden`}
    >
      <div
        className={`absolute top-0 right-0 p-4 opacity-10 text-${color}-500`}
      >
        <Icon size={64} />
      </div>
      <div className="relative z-10">
        <div
          className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 w-fit mb-4`}
        >
          <Icon
            className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`}
          />
        </div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
          {title}
        </h3>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </span>
          {trend !== undefined && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                trend >= 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
