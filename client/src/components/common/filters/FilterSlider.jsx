import React from 'react';

export const FilterSlider = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v
}) => {
  const displayValue = value === '' || value === null ? min : Number(value);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-end mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</label>
          <span className="text-sm font-medium text-zinc-200">{formatValue(displayValue)}</span>
        </div>
      )}
      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300 outline-none hover:bg-zinc-700 transition-colors"
          style={{
            background: `linear-gradient(to right, #d4d4d8 0%, #d4d4d8 ${(displayValue - min) / (max - min) * 100}%, #27272a ${(displayValue - min) / (max - min) * 100}%, #27272a 100%)`
          }}
        />
        {/* 👇 Here is the fixed line 👇 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            input[type=range]::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #f4f4f5;
              cursor: pointer;
              border: 2px solid #18181b;
              box-shadow: 0 0 0 1px #3f3f46;
              transition: all 0.2s;
            }
            input[type=range]::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 0 0 2px #52525b;
            }
          `
        }} />
      </div>
      <div className="flex justify-between text-[10px] uppercase text-zinc-500 font-medium mt-2">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};
