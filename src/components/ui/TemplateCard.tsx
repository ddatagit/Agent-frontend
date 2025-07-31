import React from "react"

export type Template = {
  title: string
  description: string
  image: string
  prompt: string
}

interface Props extends Template {
  onSelect: (prompt: string) => void
}

const TemplateCard: React.FC<Props> = ({
  title,
  description,
  image,
  prompt,
  onSelect,
}) => (
  <div
    onClick={() => onSelect(prompt)}
    className="group cursor-pointer w-full"
  >
    {/* Card Image with Hover Overlay */}
    <div className="relative h-52 w-full rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-center items-center text-center p-4">
        <p className="text-sm text-white">{description}</p>
      </div>
    </div>

    {/* Title shown outside the card */}
    <div className="mt-2 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  </div>
)

export default TemplateCard
