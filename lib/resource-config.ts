import type { ResourceConfig, ResourceKind } from "@/types";

export const resourceConfigs: Record<ResourceKind, ResourceConfig> = {
  problems: {
    table: "problems",
    label: "困りごと相談",
    singular: "相談",
    accent: "Problem",
    icon: "lightbulb",
    intro: "経営や現場で抱えている課題を共有し、経験や専門性を持つ青年部の仲間に相談できます。",
    titlePlaceholder: "例：SNSを活用した集客について相談したい",
    descriptionPlaceholder: "困っていること、これまで試したこと、どんな支援を求めているかをご記入ください。",
  },
  collaborations: {
    table: "collaborations",
    label: "コラボ募集",
    singular: "募集",
    accent: "Collaboration",
    icon: "handshake",
    intro: "共同商品、イベント、販路開拓など、新しい取り組みを一緒に進める仲間を募集できます。",
    titlePlaceholder: "例：奈良県産品を使った共同商品開発メンバー募集",
    descriptionPlaceholder: "企画内容、募集するパートナー、時期や条件などをご記入ください。",
  },
  successes: {
    table: "successes",
    label: "成功事例",
    singular: "事例",
    accent: "Success Story",
    icon: "trophy",
    intro: "青年部のつながりから生まれた仕事や協業を共有し、次の挑戦のヒントにつなげます。",
    titlePlaceholder: "例：飲食店と農家の連携で新メニューが誕生",
    descriptionPlaceholder: "連携のきっかけ、取り組んだ内容、工夫した点などをご記入ください。",
  },
};
