import React, { useState, useEffect, useRef } from 'react';
import { parseMoney, formatMoneyStr } from '../utils/calculations';

const MoneyInput = ({ value, onChange, label, className = "", id, mb = "mb-2", ...props }) => {
  const [inputValue, setInputValue] = useState(formatMoneyStr(value));
  const [showMenu, setShowMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(formatMoneyStr(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    setInputValue(rawVal);
    
    const num = parseMoney(rawVal);
    if (num === 0) {
      setSuggestions([]);
      setShowMenu(false);
      return;
    }

    const newSuggestions = [];
    if (num < 1000000000) newSuggestions.push({ val: num * 1000000000, label: 'tỷ' });
    if (num < 1000000) newSuggestions.push({ val: num * 1000000, label: 'triệu' });
    
    setSuggestions(newSuggestions);
    setShowMenu(newSuggestions.length > 0);
  };

  const handleBlur = () => {
    const num = parseMoney(inputValue);
    const formatted = formatMoneyStr(num);
    setInputValue(formatted);
    onChange(num);
    // Note: setShowMenu is handled by click outside or selection
  };

  const handleSelect = (val) => {
    setInputValue(formatMoneyStr(val));
    onChange(val);
    setShowMenu(false);
  };

  const handleFocus = (e) => {
    const len = e.target.value.length;
    const endSelection = len <= 2 ? len : len - 2;
    e.target.setSelectionRange(0, endSelection);
  };

  return (
    <div className={mb} ref={wrapperRef}>
      {label && <label className="form-label">{label}</label>}
      <div className="money-wrapper">
        <input
          type="text"
          id={id}
          className={`form-control money-input ${className}`}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          autoComplete="off"
          {...props}
        />
        {showMenu && (
          <div className="bank-autocomplete" style={{ display: 'block' }}>
            {suggestions.map((item, idx) => (
              <div 
                key={idx} 
                className="bank-autocomplete-item" 
                onClick={() => handleSelect(item.val)}
              >
                <span className="fw-bold text-primary">{formatMoneyStr(item.val)}</span>
                <span className="text-muted"> ({parseMoney(inputValue)} {item.label})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyInput;
