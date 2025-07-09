import type { Meta, StoryObj } from '@storybook/react';
import TourCard from './TourCard';

const meta: Meta<typeof TourCard> = {
  title: 'Components/TourCard',
  component: TourCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    item: {
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    item: {
      tAtsNm: '경복궁',
      areaCd: '1',
      tAtsCd: '12345',
    },
  },
};

export const LongName: Story = {
  args: {
    item: {
      tAtsNm: '매우 긴 여행지 이름입니다. 이것은 테스트를 위한 긴 이름입니다.',
      areaCd: '2',
      tAtsCd: '67890',
    },
  },
};

export const DifferentArea: Story = {
  args: {
    item: {
      tAtsNm: '부산 해운대',
      areaCd: '6',
      tAtsCd: '11111',
    },
  },
}; 