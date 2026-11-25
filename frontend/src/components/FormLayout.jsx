import React from "react";

const FormLayout = ({ title, children, footer, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      
      {/* Container */}
      <div className="w-full  h-full  bg-white/40 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormLayout;