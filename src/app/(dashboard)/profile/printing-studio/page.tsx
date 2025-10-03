'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { CardPreview } from '@/components/card-creation/preview';
import type { CardDetails, CardSettings } from '@/lib/types';

type UserCard = {
  userCard: {
    id: string;
    userId: string;
    public: boolean;
    cardPreviewId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  cardPreview: CardDetails | null;
};

export default function Page() {
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<(UserCard | null)[]>([null, null, null, null]);
  const [openDropdowns, setOpenDropdowns] = useState<boolean[]>([false, false, false, false]);
  const [cardSettings, setCardSettings] = useState<CardSettings[]>([
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true },
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true },
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true },
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true },
  ]);

  const fetchUserCards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-cards');
      const data = await response.json();
      if (data.success) {
        setUserCards(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showCardPreview) {
      fetchUserCards();
    }
  }, [showCardPreview]);

  const handleCardSelect = (cardIndex: number, card: UserCard | null) => {
    const newSelectedCards = [...selectedCards];
    newSelectedCards[cardIndex] = card;
    setSelectedCards(newSelectedCards);
    
    const newOpenDropdowns = [...openDropdowns];
    newOpenDropdowns[cardIndex] = false;
    setOpenDropdowns(newOpenDropdowns);
  };

  const toggleDropdown = (cardIndex: number) => {
    const newOpenDropdowns = [...openDropdowns];
    newOpenDropdowns[cardIndex] = !newOpenDropdowns[cardIndex];
    setOpenDropdowns(newOpenDropdowns);
  };

  const updateCardSetting = (cardIndex: number, setting: keyof CardSettings, value: boolean) => {
    const newSettings = [...cardSettings];
    newSettings[cardIndex] = {
      ...newSettings[cardIndex],
      [setting]: value,
    };
    setCardSettings(newSettings);
  };

  if (showCardPreview) {
    return (
      <div>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='font-eveleth-clean text-2xl font-bold'>Print Preview - Cards</h1>
          <Button 
            variant='outline' 
            onClick={() => setShowCardPreview(false)}
          >
            Back to Options
          </Button>
        </div>
        
        <div className='space-y-8'>
          {/* Page 1 - Front of cards */}
          <div className='mx-auto max-w-[210mm] bg-white p-4 shadow-lg' style={{ aspectRatio: '210/297' }}>
            <div className='mb-2 text-center text-sm font-medium text-gray-600'>Page 1 - Front</div>
            <div className='grid h-full grid-cols-2 grid-rows-2 gap-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div 
                  key={`front-${index}`}
                  className='relative border-2 border-dashed border-gray-300 bg-gray-50'
                >
                  {/* Card Preview Background Layer */}
                  <div className='absolute inset-0 flex items-center justify-center p-2'>
                    {selectedCards[index]?.cardPreview ? (
                      <div className='scale-75 origin-center'>
                        <CardPreview
                          card={selectedCards[index]!.cardPreview!}
                          settings={cardSettings[index]}
                        />
                      </div>
                    ) : (
                      <div className='text-xs text-gray-500'>Card Preview</div>
                    )}
                  </div>
                  
                  {/* Controls Overlay Layer */}
                  <div className='relative z-10 bg-white/90 backdrop-blur-sm p-2 space-y-2 text-black'>
                    <Popover open={openDropdowns[index]} onOpenChange={() => toggleDropdown(index)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openDropdowns[index]}
                          className="w-full justify-between text-xs h-8 text-black"
                        >
                          {selectedCards[index]?.cardPreview?.name || "Select card..."}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search cards..." className="h-8" />
                          <CommandList>
                            <CommandEmpty>No cards found.</CommandEmpty>
                            <CommandGroup>
                              {userCards.map((card) => (
                                <CommandItem
                                  key={card.userCard.id}
                                  value={card.cardPreview?.name || ''}
                                  onSelect={() => handleCardSelect(index, card)}
                                  className="text-xs"
                                >
                                  <Check
                                    className={`mr-2 h-3 w-3 ${
                                      selectedCards[index]?.userCard.id === card.userCard.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {card.cardPreview?.name || 'Unnamed Card'}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {selectedCards[index] && (
                      <div className='flex flex-wrap gap-2'>
                        <div className='flex items-center space-x-1'>
                          <input
                            type='checkbox'
                            id={`border-${index}`}
                            checked={cardSettings[index].border}
                            onChange={(e) => updateCardSetting(index, 'border', e.target.checked)}
                            className='rounded'
                          />
                          <label htmlFor={`border-${index}`} className='text-xs text-black'>Border</label>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <input
                            type='checkbox'
                            id={`artist-${index}`}
                            checked={cardSettings[index].artist}
                            onChange={(e) => updateCardSetting(index, 'artist', e.target.checked)}
                            className='rounded'
                          />
                          <label htmlFor={`artist-${index}`} className='text-xs text-black'>Artist</label>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <input
                            type='checkbox'
                            id={`credits-${index}`}
                            checked={cardSettings[index].credits}
                            onChange={(e) => updateCardSetting(index, 'credits', e.target.checked)}
                            className='rounded'
                          />
                          <label htmlFor={`credits-${index}`} className='text-xs text-black'>Credits</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page 2 - Back of cards */}
          <div className='mx-auto max-w-[210mm] bg-white p-4 shadow-lg' style={{ aspectRatio: '210/297' }}>
            <div className='mb-2 text-center text-sm font-medium text-gray-600'>Page 2 - Back</div>
            <div className='grid h-full grid-cols-2 grid-rows-2 gap-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div 
                  key={`back-${index}`}
                  className='border-2 border-dashed border-gray-300 bg-gray-50'
                >
                  <div className='flex h-full items-center justify-center text-sm text-gray-500'>
                    Card {index + 1} Back
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className='font-eveleth-clean text-2xl font-bold'>Printing Studio</h1>
      <p className='text-muted-foreground'>
        Print your cards and adversaries with professional quality
      </p>
      
      <div className='my-6 space-y-6'>
        <div className='bg-card rounded-lg border p-6'>
          <h2 className='mb-4 text-lg font-semibold'>Print Your Content</h2>
          <p className='text-muted-foreground mb-6'>
            Generate print-ready PDFs of your custom cards and adversaries.
          </p>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='rounded-lg border p-6 text-center'>
              <h3 className='mb-2 text-lg font-medium'>Print Your Cards</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Print your custom cards in standard playing card format
              </p>
              <Button 
                className='w-full'
                onClick={() => setShowCardPreview(true)}
              >
                Print Your Cards
              </Button>
            </div>
            <div className='rounded-lg border p-6 text-center'>
              <h3 className='mb-2 text-lg font-medium'>Print Your Adversaries</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Print your custom adversaries with stat blocks and abilities
              </p>
              <Button className='w-full'>
                Print Your Adversaries
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
