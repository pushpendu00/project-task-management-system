// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           50: "#eef2ff",
//           100: "#e0e7ff",
//           200: "#c7d2fe",
//           300: "#a5b4fc",
//           400: "#818cf8",
//           500: "#6366f1",
//           600: "#4f46e5",
//           700: "#4338ca",
//           800: "#3730a3",
//           900: "#312e81",
//         },
//         dark: {
//           50: "#f8fafc",
//           100: "#f1f5f9",
//           200: "#e2e8f0",
//           700: "#334155",
//           800: "#1e293b",
//           900: "#0f172a",
//           950: "#020617",
//         },
//       },
//       fontFamily: {
//         sans: ["Inter", "ui-sans-serif", "system-ui"],
//       },
//       animation: {
//         "fade-in": "fadeIn 0.2s ease-in-out",
//         "slide-in": "slideIn 0.3s ease-out",
//       },
//       keyframes: {
//         fadeIn: {
//           "0%": { opacity: "0" },
//           "100%": { opacity: "1" },
//         },
//         slideIn: {
//           "0%": { transform: "translateY(-10px)", opacity: "0" },
//           "100%": { transform: "translateY(0)", opacity: "1" },
//         },
//       },
//     },
//   },
//   plugins: [],
// };

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`
    }
    return `rgb(var(${variableName}))`
  }
}

module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        dark: {
          50: withOpacity('--color-dark-50'),
          100: withOpacity('--color-dark-100'),
          200: withOpacity('--color-dark-200'),
          700: withOpacity('--color-dark-700'),
          800: withOpacity('--color-dark-800'),
          850: withOpacity('--color-dark-850'),
          900: withOpacity('--color-dark-900'),
          950: withOpacity('--color-dark-950'),
        },
        slate: {
          50: withOpacity('--color-slate-50'),
          100: withOpacity('--color-slate-100'),
          200: withOpacity('--color-slate-200'),
          300: withOpacity('--color-slate-300'),
          350: withOpacity('--color-slate-350'),
          400: withOpacity('--color-slate-400'),
          450: withOpacity('--color-slate-450'),
          500: withOpacity('--color-slate-500'),
          600: withOpacity('--color-slate-600'),
          700: withOpacity('--color-slate-700'),
          800: withOpacity('--color-slate-800'),
          900: withOpacity('--color-slate-900'),
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
