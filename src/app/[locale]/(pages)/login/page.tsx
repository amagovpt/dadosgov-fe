import type { Metadata } from 'next';
import LoginClient from '@/components/login/LoginClient';
import initTranslations from '@/app/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const { t } = await initTranslations({ locale, namespaces: ['login'] });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
    };
}

export default function LoginPage() {
    return <LoginClient />;
}
