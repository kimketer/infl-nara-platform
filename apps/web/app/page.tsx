import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import TourList from '@/components/TourList';
import SearchForm from '@/components/SearchForm';

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Page() {
  return (
    <main className="container mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">인플루언서 여행 플랫폼</h1>
        <p className="text-lg text-gray-600 mb-6">최고의 여행지를 발견하고 공유하세요</p>
        <SearchForm />
      </div>
      
      <section>
        <h2 className="text-3xl font-bold mb-6">추천 여행지</h2>
        <TourList />
      </section>
    </main>
  );
}
