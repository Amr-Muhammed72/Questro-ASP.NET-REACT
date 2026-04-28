import React from 'react';

const RealmCard = ({ title, description, actionText, icon: Icon, colorTheme }) => {
  const themes = {
    cyan: "from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 text-cyan-400",
    purple: "from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 text-purple-400",
    yellow: "from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 text-yellow-400",
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-lg border border-zinc-700/30 rounded-2xl p-6 group transition cursor-pointer">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-br rounded-lg flex items-center justify-center transition ${themes[colorTheme]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-zinc-400 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default RealmCard;