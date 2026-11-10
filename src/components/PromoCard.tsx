
type PromoCardProps = {
  image: string;
  title: string;
  description: string;
  link?: string;
};

export default function PromoCard({
  image,
  title,
  description,
  link,
}: PromoCardProps) {
  return (
    <a
      href={link || "#"}
      target={link ? "_blank" : undefined}
      rel={link ? "noopener noreferrer" : undefined}
      className="group flex h-32 sm:h-36 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Image */}
      <div className="w-3/5 sm:w-1/3 shrink-0 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
        <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
          Sponsored
        </span>

        <h3 className="text-sm font-bold text-gray-900">
          {title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </a>
  );
}
