import CardGeneral from "@/components/Primitives/Cards/CardGeneral";
import SimpleCardImage from "@/components/Primitives/Cards/SimpleCardImage";
import HeroCourses from "@/components/Courses/Hero";
import Button from "@/components/Primitives/Button";
import apolloClient from "@/services/apollo-client";
import { getCoursesPage } from "@/services/queries/courses/courses";
import { flattenData } from "@/utils/flattenObject";
import { PageCourses } from "@/services/types/courses";
import dayjs from "dayjs";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { getAssets } from "@/utils/getAssets";


export default async function page() {


  const { data, error } = await apolloClient.query<{
    findPageCursosSingleton: {
      data: Record<string, unknown>
    }
  }>({
    query: getCoursesPage("pt")
  })

  if (!data && error) {
    console.error("Error fetching courses page data:", error);
    return <div>Error loading page data</div>;
  }

  const { hero, miniCourses, otherCourses } = flattenData(data?.findPageCursosSingleton?.data || {}) as unknown as PageCourses;



  return (
    <main className="w-full h-full">
      <HeroCourses {...{
        img: {
          src: hero.image && hero.image[0].id ? getAssets(hero.image[0].id) : "/card-full-image.png",
          alt: hero.title ?? "Curso"
        },
        updatedAt: hero.updatedAt,
        title: hero.title,
        description: hero.description,
        breadcrumbItems: [
          { label: 'Início', url: '/' },
          { label: 'Cursos', url: '/pages/courses/' },
        ]
      }} />
      <section className="bg-secondary-700 py-64 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-32">
          <div className="w-full text-white flex flex-col gap-16">
            <h2 className="text-xl-bold">
              {formatHtmlParagraphs(miniCourses.title)}
            </h2>
            <span>
              {formatHtmlParagraphs(miniCourses.description)}
            </span>
          </div>
          <div className="w-full h-full grid gap-32 grid-cols-12 ">
            {miniCourses.courses.map((course, index) => (
              <div className="col-span-12 lg:col-span-4 bg-wihte [&_a]:hidden [&_p]:hidden [&_.content]:!h-full" key={index}>
                <CardGeneral {
                  ...{
                    titleText: course.title,
                    descriptionText: "",
                    subtitleText: `Publicado a ${dayjs(course.updatedAt).format('DD.MM.YYYY')}`,
                    imageIndent: true,
                    className: "",
                    image: {
                      src: course.cover && course.cover[0] ? getAssets(course.cover[0].id) : "/card-full-image.png",
                      alt: course.title ?? "Curso",
                      width: 352,
                      height: 208
                    },
                    isBlockedLink: true,
                    anchor: {
                      href: `mini-courses/${course.id}`,
                      children: ""
                    }
                  }
                } />
              </div>
            ))}

          </div>
          <div className="w-full ">
            {miniCourses.anchor && (
              <Button variant="primary" appearance="link" className="!text-white [&_.icon]:hover:!fill-white [&_.icon]:!fill-white hover:!decoration-white" trailingIcon="agora-line-arrow-right-circle" trailingIconHover="agora-solid-arrow-right-circle" hasIcon={true}>
                {miniCourses.anchor.children}
              </Button>
            )}
          </div>
        </div>
      </section>
      <section className="pt-64 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-32">
          <div className="w-full text-primary-900 flex flex-col gap-16">
            <h2 className="text-xl-bold">
              {otherCourses.title}
            </h2>
            <div>
              <span className="">
                {formatHtmlParagraphs(otherCourses.description)}
              </span>
              <div className="w-full bg-neutral-200 h-2 mt-12" />
            </div>
          </div>
          <div className="w-full h-full grid gap-32 grid-cols-12 py-32">
            {otherCourses.courses.map((course, index) => (
              <div className="col-span-12 lg:col-span-4 bg-wihte" key={index}>
                <SimpleCardImage
                  {...{
                    img: {
                      src: course.image && course.image[0].id ? getAssets(course.image[0].id) : "courses/academia_portugal.png",
                      alt: "Academia Portugal Digital"
                    },
                    title: course.title,
                    description: formatHtmlParagraphs(course.description),
                    link: {
                      href: course.anchor?.href ?? "#",
                      text: course.anchor?.children ?? ""
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  )
}
