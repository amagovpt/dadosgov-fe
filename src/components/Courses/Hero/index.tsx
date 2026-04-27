"use client";
import Image from "next/image";
import { Breadcrumb } from "@ama-pt/agora-design-system";

export default function HeroCourses() {
    return (
        <div className="bg-primary-100 w-full py-64 flex items-center justify-center">
            <div className="container">
                <Breadcrumb
                    items={[
                        { label: 'Início', url: '/' },
                        { label: 'Cursos', url: '/pages/courses/' },
                        { label: 'Minicursos', url: '/pages/courses/mini-courses/' }
                    ]}
                    className="mb-64"
                />
                <div className="flex lg:flex-row flex-col items-center gap-64">
                    <div className="w-full">
                        <h1 className="text-3xl-bold text-primary-600 mb-32">
                            Minicursos
                        </h1>

                        <div className="text-m-regular space-y-16 w-full">
                            <p>
                                As formações do Mosaico destinam-se a diferentes perfis da Administração Pública e visam apoiar o desenvolvimento de competências essenciais para a transformação digital do Estado. Através de uma abordagem prática, permitem desenvolver conhecimentos técnicos e estratégicos para modernizar serviços públicos e melhorar a eficiência e a qualidade do atendimento.
                            </p>
                        </div>

                        <div className="mt-64">
                            Atualizado em 30.09.2025
                        </div>
                    </div>
                    <div className="w-full h-full flex items-center justify-center">
                        <Image src="/minicourses/mini_cursos.svg" alt="Minicursos" width={597} height={390} />
                    </div>
                </div>
            </div>
        </div>

    )
}
