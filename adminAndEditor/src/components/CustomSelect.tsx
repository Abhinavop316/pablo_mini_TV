import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  helperText?: string;
  className?: string;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Select --',
  label,
  required = false,
  disabled = false,
  searchable = true,
  helperText,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return {
        value: opt,
        label: opt.charAt(0).toUpperCase() + opt.slice(1),
      };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const showSearch = searchable && normalizedOptions.length > 5;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
      }}
      id={id}
    >
      {label && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontFamily: 'var(--font-heading)',
          }}
        >
          <span>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </span>
          {value && (
            <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>
              selected: {selectedOption?.label || value}
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 16px',
          backgroundColor: isOpen ? '#ffffff' : '#faf9fc',
          border: isOpen
            ? '2px solid #7c3aed'
            : value
            ? '1.5px solid rgba(124, 58, 237, 0.4)'
            : '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: isOpen
            ? '0 0 0 4px rgba(124, 58, 237, 0.16), 0 8px 20px rgba(84, 52, 136, 0.08)'
            : '0 2px 6px rgba(84, 52, 136, 0.03)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              {selectedOption.icon || (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#7c3aed',
                    flexShrink: 0,
                    boxShadow: '0 0 6px #7c3aed',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#543488',
                  fontFamily: 'var(--font-heading)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#ede9fe',
                    color: '#6d28d9',
                    fontWeight: 700,
                  }}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '14px', color: 'rgba(84, 52, 136, 0.45)', fontWeight: 500 }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {value && !required && !disabled && (
            <div
              onClick={handleClear}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'rgba(84, 52, 136, 0.08)',
                color: '#543488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Clear selection"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ede9fe')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(84, 52, 136, 0.08)')}
            >
              <X size={12} />
            </div>
          )}

          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: isOpen ? '#ede9fe' : 'transparent',
              color: isOpen ? '#7c3aed' : '#543488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease',
            }}
          >
            <ChevronDown size={16} />
          </div>
        </div>
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '2px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 40px rgba(84, 52, 136, 0.2), 0 4px 12px rgba(124, 58, 237, 0.1)',
            overflow: 'hidden',
            animation: 'popoverEntrance 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'top center',
          }}
        >
          {/* Search Header */}
          {showSearch && (
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(84, 52, 136, 0.1)',
                backgroundColor: '#fbfaff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Search size={14} color="#7c3aed" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '13px',
                  color: '#543488',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: '#7c3aed', padding: '2px', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'rgba(84, 52, 136, 0.5)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                }}
              >
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'linear-gradient(135deg, #ede9fe, #f5f3ff)' : 'transparent',
                      background: isSelected
                        ? 'linear-gradient(135deg, #ede9fe, #f5f3ff)'
                        : 'transparent',
                      color: isSelected ? '#543488' : '#3f2669',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '13px',
                      fontFamily: 'var(--font-heading)',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                      marginBottom: '2px',
                      border: isSelected ? '1px solid #c4b5fd' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#faf8fd';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#7c3aed' : 'rgba(84, 52, 136, 0.25)',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{opt.label}</span>
                          {opt.value !== opt.label.toLowerCase() && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'rgba(84, 52, 136, 0.5)',
                                fontWeight: 500,
                              }}
                            >
                              ({opt.value})
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(84, 52, 136, 0.6)', fontWeight: 500 }}>
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isSelected && (
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#7c3aed',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)',
                            animation: 'jellyBounce 0.4s ease',
                          }}
                        >
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {helperText && (
        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
