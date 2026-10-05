import { useId } from 'react';

const ARCH =
  'M285 572A342 342 0 0 1 969 572V928C969 942 958 949 946 943L831 879C822 874 817 866 817 856V582A190 190 0 0 0 437 582V856C437 866 432 874 423 879L308 943C296 949 285 942 285 928Z';
const ROAD =
  'M678 646C668 641 640 642 620 648C578 661 540 685 526 715C514 742 530 770 545 795C566 832 556 873 500 915C430 966 330 1032 245 1085C214 1104 224 1132 258 1132H628C648 1132 660 1122 670 1104C724 1010 752 940 748 878C744 812 700 780 640 740C612 721 600 708 604 694C610 676 644 658 672 652C680 650 682 648 678 646Z';

export function LogoMark({ className = 'size-7' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 1254 1254" width="24" height="24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1F74FF" />
          <stop offset="1" stopColor="#0659F6" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="1238" height="1238" rx="268" fill={`url(#${id}bg)`} />
      <path fill="#F8F3EA" d={ARCH} />
      <path fill="#F8F3EA" d={ROAD} />
    </svg>
  );
}

/** Wordmark as the app sidebar draws it: bold "Tunnel", regular "Agent". */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[15px] tracking-tight ${className}`}>
      <LogoMark className="size-6" />
      <span>
        <span className="font-bold">Tunnel</span> <span className="font-normal">Agent</span>
      </span>
    </span>
  );
}
