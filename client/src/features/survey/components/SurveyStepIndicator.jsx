import React from 'react';

const SurveyStepIndicator = ({ currentStep, totalSteps = 3 }) => {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
        <div 
          key={i} 
          className={`h-2 rounded-full transition-all duration-300 ${currentStep === i ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-700'}`} 
        />
      ))}
    </div>
  );
};

export default SurveyStepIndicator;
