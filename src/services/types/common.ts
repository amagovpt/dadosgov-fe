export interface Image {
    url: string
    filename: string
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

