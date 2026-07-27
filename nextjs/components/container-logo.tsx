import Image from "next/image";

interface ContainerLogoProps {
  imageUrl?: string | null;
  name: string;
  size?: number;
}

export default function ContainerLogo({ imageUrl, name, size = 30 }: ContainerLogoProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0"
      />
    );
  }

  return (
    <div
      className="rounded-[6px] bg-muted-foreground/20 flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <span className="text-xs font-medium text-muted-foreground">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
