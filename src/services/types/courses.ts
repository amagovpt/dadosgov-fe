import { Anchor, Hero, Image } from "./common"


export interface CourseDeatil {
  title: string
  description: string
  image: Image[]
  anchor: Anchor
}


export interface BodyCourse {
  title?: string
  description?: string
  image?: Image[]
  imagePosition:string | null
}

export interface MiniCourseDetail {
  id: string
  title: string
  description: string
  updatedAt: string
  cover: Image[]
  introduction: BodyCourse
  steps: BodyCourse[]
  conclusion: BodyCourse
}


export interface MiniCourses {
  title: string
  description: string
  courses: {
    id: string
    title: string
    description: string
    updatedAt: string
    cover: Image[]
  }[]
  anchor: Anchor
}

export interface OtherCourses {
  title: string
  description: string
  courses: CourseDeatil[]
}

export interface PageCourses {
  hero: Hero
  miniCourses: MiniCourses
  otherCourses: OtherCourses
}

export interface PageMiniCourses {
  hero: Hero
  minicursos: {
    id: string
    title: string
    description: string
    updatedAt: string
  }[]
}
