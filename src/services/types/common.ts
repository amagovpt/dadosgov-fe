export interface Image {
    url: string
    fileName: string
    id: string
    slug: string
}

export interface Hero {
  title: string
  description: string
  image: Image[]
  updatedAt: string
}

export interface Anchor {
  children: string
  href: string
}

