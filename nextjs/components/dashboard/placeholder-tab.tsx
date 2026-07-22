export default function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">{name} content coming soon.</p>
    </div>
  );
}
