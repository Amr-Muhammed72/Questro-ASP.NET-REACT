import React from 'react';
import { motion } from 'framer-motion';

const countries = ["US", "UK", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "India", "Other"];

const LocationStep = ({ formData, updateFormData }) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Where are you from? <span className="text-red-500">*</span></h3>
        <select 
          value={formData.country}
          onChange={(e) => updateFormData('country', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        >
          <option value="">Select a country</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};

export default LocationStep;
