"use client"
import { Button as ButtonADS, ButtonProps } from '@ama-pt/agora-design-system';
import { useRouter } from 'next/navigation';

export default function ButtonNavigate(args: ButtonProps & { href: string }) {
    const router = useRouter();
    return <ButtonADS {...args} onClick={() => router.push(args.href)} />
}
