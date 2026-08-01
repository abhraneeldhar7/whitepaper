import { cn } from '@/lib/utils';
import { useId } from 'react';
import PaperVisual from './PaperVisual';

export interface FolderNotesProps {
  logoUrl?: string | null;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const FolderVisuals: React.FC<FolderNotesProps> = ({
  width,
  height,
  className = '',
}) => {
  const idPrefix = useId().replace(/:/g, '');
  const backGrad = `backGrad-${idPrefix}`;
  const glassFill = `glassFill-${idPrefix}`;
  const glassStroke = `glassStroke-${idPrefix}`;
  const paperShadow = `paperShadow-${idPrefix}`;
  const mainShadow = `mainShadow-${idPrefix}`;
  const glassBlur = `glassBlur-${idPrefix}`;
  const glassClip = `glassClip-${idPrefix}`;

  const frontFolderPath =
    `M 74 340 
     L 326 340 
     A 24 24 0 0 0 350 316 
     L 350 214 
     A 24 24 0 0 0 326 190 
     L 190 190 
     C 175 190, 165 160, 150 160 
     L 74 160 
     A 24 24 0 0 0 50 184 
     L 50 316 
     A 24 24 0 0 0 74 340 Z`;

  return (
    <div
      className={cn("group md:w-[180px] md:h-[180px]", className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: width ?? undefined,
        height: height ?? undefined,
      }}
    >
      <svg
        viewBox="35 70 330 300"
        style={{ width: '100%', height: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={mainShadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="15" stdDeviation="20" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          <filter id={paperShadow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="-2" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.12" />
          </filter>

          <filter id={glassBlur} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
            <feColorMatrix type="matrix" values="1.1 0 0 0 0  0 1.1 0 0 0  0 0 1.1 0 0  0 0 0 1 0" />
          </filter>

          <clipPath id={glassClip}>
            <path d={frontFolderPath} />
          </clipPath>

          <linearGradient id={backGrad} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A2A2E" />
            <stop offset="100%" stopColor="#111113" />
          </linearGradient>

          <linearGradient id={glassFill} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id={glassStroke} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <rect x="60" y="140" width="280" height="200" rx="28" fill="rgba(0,0,0,0)" filter={`url(#${mainShadow})`} />

        <g>
          <rect x="50" y="110" width="300" height="230" rx="28" fill={`url(#${backGrad})`} />
          <rect x="51.5" y="111.5" width="297" height="227" rx="26.5" fill="none" stroke="#4a4a50" strokeWidth="1.5" />
          <PaperVisual variant="back" inline shadowFilterId={paperShadow}
            className="[transform-box:view-box] origin-[220px_200px] translate-x-[32px] translate-y-[28px] rotate-[10deg] group-hover:translate-x-[50px] group-hover:translate-y-[18px] group-hover:rotate-[15deg]" />
          <PaperVisual variant="middle" inline shadowFilterId={paperShadow}
            className="[transform-box:view-box] origin-[220px_200px] z-10 -translate-x-[10px] translate-y-[11px] group-hover:-translate-x-[10px] group-hover:translate-y-[6px]" />
          <PaperVisual variant="front" inline shadowFilterId={paperShadow}
            className="[transform-box:view-box] origin-[220px_200px] -translate-x-[52px] translate-y-[22px] -rotate-[9deg] group-hover:-translate-x-[68px] group-hover:translate-y-[12px] group-hover:-rotate-[14deg]" />
        </g>

        <g filter={`url(#${glassBlur})`} clipPath={`url(#${glassClip})`}>
          <rect x="50" y="110" width="300" height="230" rx="28" fill={`url(#${backGrad})`} />
          <rect x="51.5" y="111.5" width="297" height="227" rx="26.5" fill="none" stroke="#4a4a50" strokeWidth="1.5" />

          <PaperVisual variant="back" inline shadowFilterId={paperShadow}
            className="[transform-box:view-box] origin-[220px_200px] translate-x-[32px] translate-y-[28px] rotate-[10deg] group-hover:translate-x-[50px] group-hover:translate-y-[18px] group-hover:rotate-[15deg]" />
          <PaperVisual variant="middle" inline shadowFilterId={paperShadow}
            className="[transform-box:view-box] origin-[220px_200px] z-10 -translate-x-[10px] translate-y-[11px] group-hover:-translate-x-[10px] group-hover:translate-y-[6px]" />
          <PaperVisual variant="front" inline shadowFilterId={paperShadow}
            className="[transform-box:view-box] origin-[220px_200px] -translate-x-[52px] translate-y-[22px] -rotate-[9deg] group-hover:-translate-x-[68px] group-hover:translate-y-[12px] group-hover:-rotate-[14deg]" />
        </g>

        <path d={frontFolderPath} fill={`url(#${glassFill})`} />
        <path d={frontFolderPath} fill="none" stroke={`url(#${glassStroke})`} strokeWidth="2.5" />
      </svg>
    </div>
  );
};

export default FolderVisuals;
