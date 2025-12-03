"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      className="theme-toggle"
      aria-pressed={isDark}
      onClick={toggleTheme}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      <span className="theme-toggle__content">
        {/* Sky background with clouds */}
        <svg
          aria-hidden="true"
          className="theme-toggle__backdrop"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 290 228"
        >
          <path
            className="clouds"
            fill="currentColor"
            d="M230.013 74.06c-4.014.823-8.046 1.45-12.134 1.45-28.368 0-51.355-23.303-51.355-52.056 0-.773.043-1.536.063-2.304C146.042 17.612 130 36.45 130 59c0 26.51 21.49 48 48 48 11.82 0 22.65-4.284 30.994-11.377 5.338 3.503 10.444 7.32 16.19 10.206 1.042.524 2.082 1.042 3.134 1.548.41-1.61.695-3.27.695-5.005v-28.312ZM48.36 112.086C37.348 112.086 28 102.51 28 91.228c0-7.876 4.42-14.72 10.91-18.268-1.564-2.742-2.466-5.922-2.466-9.326 0-10.488 8.502-18.99 18.99-18.99 2.634 0 5.14.536 7.422 1.508C66.21 39.404 73.08 34 81.286 34c10.488 0 18.99 8.502 18.99 18.99 0 .772-.072 1.526-.148 2.276 1.802-.352 3.66-.552 5.572-.552 14.786 0 26.776 11.99 26.776 26.776 0 14.786-11.99 26.776-26.776 26.776-1.426 0-2.824-.116-4.188-.318-3.108 2.666-7.132 4.292-11.542 4.292-5.224 0-9.916-2.26-13.176-5.86-2.644 1.13-5.556 1.76-8.628 1.76-8.314 0-15.466-4.752-18.99-11.692-.72.054-1.446.09-2.184.09-.232 0-.464-.012-.694-.022-.066 9.282-7.616 16.77-16.938 16.77Z"
          />
        </svg>

        {/* Stars for night mode */}
        <svg
          aria-hidden="true"
          className="theme-toggle__backdrop stars"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 290 228"
        >
          <g fill="currentColor">
            <path d="M270.486 78.286 272 74l-4.286 1.514L264 74l1.514 4.286L264 82.572 268.286 81l3.714 1.572-1.514-4.286ZM234.8 42l2.4-6.857L230.343 38l-6.857-2.857 6.857-2.4L228.2 26l2.4 6.857L237.457 30l-6.857 2.857 4.2 2.286ZM30.114 111.714 32 106l-5.714 2.114L20 106l2.114 5.714L20 117.428 25.714 115l4.572 2.428-2.172-5.714ZM68.657 54l3.429-9.257L62.829 48 53.6 44.743l9.229-3.086L60.657 33l3.429 9.257L73.371 39l-9.229 3.257L68.657 48v6Z" />
            <path d="M189.714 14.286 192 8l-6.286 2.114L180 8l2.114 6.286L180 20.572 186.286 18 192 20.572l-2.286-6.286Z" />
            <path d="M148.457 103.714 151.314 96l-7.771 2.771L136 96l2.771 7.771L136 111.543l7.543-2.772 7.771 2.772-2.857-7.829Z" />
            <path d="M226.4 181.714 229.6 172l-9.6 3.657L210.4 172l3.657 9.657L210.4 191.2l9.6-3.657 9.6 3.657-3.2-9.486Z" />
          </g>
        </svg>

        {/* Indicator (sun/moon) */}
        <span className="theme-toggle__indicator-wrapper">
          <span className="theme-toggle__indicator">
            <span className="theme-toggle__star">
              <span className="sun"></span>
              <span className="moon">
                <span
                  className="moon__crater"
                  style={
                    {
                      "--size": 18,
                      "--x": 40,
                      "--y": 15,
                    } as React.CSSProperties
                  }
                ></span>
                <span
                  className="moon__crater"
                  style={
                    {
                      "--size": 20,
                      "--x": 65,
                      "--y": 58,
                    } as React.CSSProperties
                  }
                ></span>
                <span
                  className="moon__crater"
                  style={
                    {
                      "--size": 34,
                      "--x": 18,
                      "--y": 40,
                    } as React.CSSProperties
                  }
                ></span>
              </span>
            </span>
          </span>
        </span>
      </span>

      <style jsx>{`
        .theme-toggle {
          -webkit-tap-highlight-color: transparent;
          width: clamp(60px, 12vmin, 90px);
          aspect-ratio: 8 / 3;
          border-radius: 100vh;
          border: 0;
          position: relative;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          transition: background 0.5s cubic-bezier(0.4, -0.3, 0.6, 1.3);
          background: hsl(
            calc(204 + (var(--dark, 0) * 25))
              calc((53 - (var(--dark, 0) * 28)) * 1%)
              calc((47 - (var(--dark, 0) * 31)) * 1%)
          );
          box-shadow: 0 0.02em 0.01em -0.0025em hsl(210 10% 100% / 0.95),
            0 -0.02em 0.01em -0.0025em hsl(210 10% 10% / 0.2),
            0 0.02em 0.5em 0 hsl(210 10% 100% / 0.15);
          outline: none;
        }

        .theme-toggle:after {
          content: "";
          position: absolute;
          inset: 0;
          box-shadow: 0 -0.025em 0.025em 0 hsl(210 10% 10% / 0.15) inset,
            0 0.025em 0.025em 0 hsl(210 10% 10% / 0.65) inset;
          border-radius: 100vh;
        }

        .theme-toggle__content {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 100vh;
          display: block;
          clip-path: inset(0 0 0 0 round 100vh);
        }

        .theme-toggle__backdrop {
          overflow: visible !important;
          position: absolute;
          bottom: 0;
          width: 100%;
          left: 0;
          transition: translate 0.5s cubic-bezier(0.4, -0.3, 0.6, 1.3);
          translate: 0 calc(var(--dark, 0) * (100% - 37.5%));
          color: hsl(0 0% 100% / 0.5);
        }

        .stars {
          color: hsl(0 0% 100% / 0.8);
        }

        .stars g {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          scale: calc(0.25 + (var(--dark, 0) * 0.75));
          transition: scale 0.5s 0.25s cubic-bezier(0.4, -0.3, 0.6, 1.3);
        }

        .theme-toggle__indicator-wrapper {
          position: absolute;
          inset: 0;
        }

        .theme-toggle__indicator {
          height: 100%;
          aspect-ratio: 1;
          border-radius: 0%;
          display: grid;
          place-items: center;
          padding: 3%;
          transition: translate 0.5s cubic-bezier(0.4, -0.3, 0.6, 1.3);
          translate: calc(var(--dark, 0) * (100% * 1.67)) 0;
        }

        .theme-toggle__star {
          height: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          position: relative;
          transition: translate 0.5s cubic-bezier(0.4, -0.3, 0.6, 1.3);
          translate: calc((var(--dark, 0) * -10%) + 5%) 0;
        }

        .sun {
          background: hsl(47, 91%, 58%);
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          z-index: calc(2 - var(--dark, 0));
          transition: z-index 0s;
          box-shadow: 0.01em 0.01em 0.02em 0 hsl(210 10% 100% / 0.95) inset,
            -0.01em -0.01em 0.02em 0 hsl(210 10% 20% / 0.5) inset;
        }

        .moon {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: hsl(212, 13%, 82%);
          z-index: calc(1 + var(--dark, 0));
          transition: z-index 0s;
          box-shadow: 0.01em 0.01em 0.02em 0 hsl(210 10% 100% / 0.95) inset,
            -0.01em -0.01em 0.02em 0 hsl(210 10% 10% / 0.95) inset;
        }

        .moon__crater {
          position: absolute;
          background: hsl(221, 16%, 68%);
          border-radius: 50%;
          width: calc(var(--size, 10) * 1%);
          aspect-ratio: 1;
          left: calc(var(--x) * 1%);
          top: calc(var(--y) * 1%);
          box-shadow: 0.01em 0.01em 0.01em 0 hsl(210 10% 6% / 0.25) inset,
            0 0.005em 0.01em 0 hsl(210 10% 100% / 0.25);
        }

        .theme-toggle__star:before {
          content: "";
          z-index: -1;
          width: 356%;
          background: radial-gradient(
              hsl(0 0% 100% / 0.25) 40%,
              transparent 40.5%
            ),
            radial-gradient(hsl(0 0% 100% / 0.25) 56%, transparent 56.5%)
              hsl(0 0% 100% / 0.25);
          border-radius: 50%;
          aspect-ratio: 1;
          position: absolute;
          top: 50%;
          left: 50%;
          transition: translate 0.5s cubic-bezier(0.4, -0.3, 0.6, 1.3);
          translate: calc((50 - (var(--dark, 0) * 4)) * -1%) -50%;
        }

        .theme-toggle__star:after {
          content: "";
          position: absolute;
          inset: 0;
          display: block;
          background: hsl(0 0% 0% / 0.5);
          filter: blur(2px);
          translate: 2% 4%;
          border-radius: 50%;
          z-index: -1;
        }

        .theme-toggle[aria-pressed="true"] {
          --dark: 1;
        }
      `}</style>
    </button>
  );
}
