type PageHeaderProps = {
  title: string;
  description: string;
  align?: "left" | "center";
};

export function PageHeader({
  title,
  description,
  align = "left",
}: PageHeaderProps) {
  const alignmentClass =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <header className={`flex flex-col gap-3 ${alignmentClass}`}>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
        {description}
      </p>
    </header>
  );
}
