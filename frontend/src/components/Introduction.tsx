import React from 'react';

const Introduction: React.FC = () => {
  return (
    <section className="text-center mb-12 md:mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        مختبر الفيزياء الرقمي
      </h1>
      <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-400">
        هنا، لا نحفظ القوانين، بل نبنيها معاً. منصتنا مصممة لتعليم الفيزياء من المبدأ الأول، عبر رحلة منطقية تبدأ من الفهم المفاهيمي العميق، مروراً بالتصور البصري، وصولاً إلى التمثيل الرياضي وتطبيقه في حل المسائل.
      </p>
    </section>
  );
};

export default Introduction;
