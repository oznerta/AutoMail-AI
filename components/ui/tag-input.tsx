import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    availableTags?: string[];
}

export function TagInput({ value = [], onChange, placeholder, availableTags = [] }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Ensure value is always an array
    const tags = Array.isArray(value) ? value : [];

    // Filter available tags that aren't already selected
    const filteredTags = availableTags.filter(
        tag => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const addTag = (tag: string) => {
        const newTag = tag.trim();
        if (newTag && !tags.includes(newTag)) {
            onChange([...tags, newTag]);
            setInputValue('');
            // Keep suggestions open if there are more options, otherwise close
            if (filteredTags.length <= 1 && newTag === inputValue) {
                setShowSuggestions(false);
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background cursor-text min-h-[42px]"
                onClick={() => {
                    inputRef.current?.focus();
                    setShowSuggestions(true);
                }}
            >
                {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {tag}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {tag}</span>
                        </Button>
                    </Badge>
                ))}

                <div className="flex-1 flex items-center min-w-[120px]">
                    <Input
                        ref={inputRef}
                        className="flex-1 border-none focus-visible:ring-0 shadow-none bg-transparent p-0 h-auto placeholder:text-muted-foreground"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ''}
                    />
                </div>

                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 self-center ml-2" />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
                    {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <div
                                key={tag}
                                className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm flex items-center justify-between"
                                onClick={() => addTag(tag)}
                            >
                                <span>{tag}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                            {inputValue ? (
                                <span className="cursor-pointer block hover:text-primary" onClick={() => addTag(inputValue)}>
                                    Create &quot;{inputValue}&quot;
                                </span>
                            ) : (
                                "No registered tags found."
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
