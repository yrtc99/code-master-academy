// Neobrutalism design system tokens

// Color palette
export const colors = {
  // Primary colors
  primary: {
    background: '#FF5C00', // Bright orange
    foreground: '#FFFFFF', // White
    hover: '#FF7A33', // Lighter orange
    border: '#000000', // Black
  },
  // Secondary colors
  secondary: {
    background: '#FFDE59', // Bright yellow
    foreground: '#000000', // Black
    hover: '#FFE880', // Lighter yellow
    border: '#000000', // Black
  },
  // Accent colors
  accent: {
    background: '#00BFFF', // Bright blue
    foreground: '#000000', // Black
    hover: '#33CCFF', // Lighter blue
    border: '#000000', // Black
  },
  success: {
    background: '#00FF85', // Bright green
    foreground: '#000000', // Black
    hover: '#33FFA0', // Lighter green
    border: '#000000', // Black
  },
  warning: {
    background: '#FFDE59', // Bright yellow
    foreground: '#000000', // Black
    hover: '#FFE880', // Lighter yellow
    border: '#000000', // Black
  },
  error: {
    background: '#FF0055', // Bright pink/red
    foreground: '#FFFFFF', // White
    hover: '#FF3377', // Lighter pink/red
    border: '#000000', // Black
  },
  // Base colors
  background: '#FFFFFF', // White
  foreground: '#000000', // Black
  muted: {
    background: '#F2F2F2', // Light gray
    foreground: '#737373', // Dark gray
    border: '#000000', // Black
  },
  card: {
    background: '#FFFFFF', // White
    foreground: '#000000', // Black
    border: '#000000', // Black
  },
};

// Shadows
export const shadows = {
  sm: '4px 4px 0px 0px #000000',
  md: '6px 6px 0px 0px #000000',
  lg: '8px 8px 0px 0px #000000',
  xl: '12px 12px 0px 0px #000000',
};

// Border widths
export const borders = {
  sm: '2px solid #000000',
  md: '3px solid #000000',
  lg: '4px solid #000000',
};

// Border radius
export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
};

// Typography
export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, sans-serif',
    mono: '"Roboto Mono", monospace',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
};

// Spacing
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

// Layout-specific values
export const layout = {
  navBarWidth: '240px',
  contentPadding: '24px',
  lessonContentWidth: '60%',
  quizPanelWidth: '40%',
};

// Utility classes for neobrutalism style
export const neobrutalism = {
  // Button styles
  button: {
    base: `font-bold py-3 px-6 border-3 border-black rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] 
          hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] 
          active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all`,
    primary: 'bg-[#FF5C00] text-white',
    secondary: 'bg-[#FFDE59] text-black',
    accent: 'bg-[#00BFFF] text-black',
    success: 'bg-[#00FF85] text-black',
    warning: 'bg-[#FFDE59] text-black',
    error: 'bg-[#FF0055] text-white',
    outline: 'bg-white text-black',
  },
  
  // Card styles
  card: {
    base: `bg-white border-3 border-black rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-5`,
    interactive: `hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] 
                 transition-all cursor-pointer`,
  },
  
  // Input styles
  input: {
    base: `bg-white border-3 border-black rounded-md p-3 focus:outline-none 
           focus:ring-0 focus:ring-offset-0 focus:border-[#FF5C00]`,
  },
  
  // Badge styles
  badge: {
    base: 'font-bold py-1 px-3 border-2 border-black rounded-full',
    primary: 'bg-[#FF5C00] text-white',
    secondary: 'bg-[#FFDE59] text-black',
    accent: 'bg-[#00BFFF] text-black',
    success: 'bg-[#00FF85] text-black',
    warning: 'bg-[#FFDE59] text-black',
    error: 'bg-[#FF0055] text-white',
  },
  
  // Navigation styles
  nav: {
    base: `bg-white border-r-3 border-black w-[240px] h-screen fixed left-0 top-0 p-5`,
    item: `block w-full text-left font-bold py-3 px-4 border-3 border-black rounded-md 
           hover:bg-[#F2F2F2] transition-all mb-2`,
    itemActive: `block w-full text-left font-bold py-3 px-4 border-3 border-black rounded-md 
                bg-[#FF5C00] text-white mb-2`,
  },
  
  // Quiz styles
  quiz: {
    option: `w-full text-left font-bold py-3 px-4 border-3 border-black rounded-md 
             hover:bg-[#F2F2F2] transition-all mb-4 cursor-pointer`,
    optionSelected: `w-full text-left font-bold py-3 px-4 border-3 border-black rounded-md 
                    bg-[#FFDE59] text-black mb-4 cursor-pointer`,
    optionCorrect: `w-full text-left font-bold py-3 px-4 border-3 border-black rounded-md 
                   bg-[#00FF85] text-black mb-4 cursor-pointer`,
    optionIncorrect: `w-full text-left font-bold py-3 px-4 border-3 border-black rounded-md 
                     bg-[#FF0055] text-white mb-4 cursor-pointer`,
    dragItem: `inline-block font-bold py-2 px-4 border-3 border-black rounded-md 
               bg-[#00BFFF] text-black mb-2 mr-2 cursor-grab active:cursor-grabbing`,
    dropZone: `border-3 border-dashed border-black rounded-md p-4 mb-4 min-h-[100px] 
               bg-[#F2F2F2]`,
    dropZoneActive: `border-3 border-dashed border-[#00FF85] rounded-md p-4 mb-4 min-h-[100px] 
                    bg-[#E6FFF2]`,
  },
};

export default {
  colors,
  shadows,
  borders,
  borderRadius,
  typography,
  spacing,
  layout,
  neobrutalism,
};
