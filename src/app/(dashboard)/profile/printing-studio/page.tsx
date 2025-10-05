'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, FileText } from 'lucide-react';
import { CardPreview, CardBackPreview } from '@/components/card-creation/preview';
import type { CardDetails, CardSettings } from '@/lib/types';
import jsPDF from 'jspdf';
import { toPng } from '@jpinsonneau/html-to-image';

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
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true, cardBack: 'default' },
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true, cardBack: 'default' },
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true, cardBack: 'default' },
    { border: true, boldRulesText: true, artist: true, credits: true, placeholderImage: true, cardBack: 'default' },
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
    
    // Load card back settings for the selected card
    if (card?.cardPreview) {
      const newCardSettings = [...cardSettings];
      newCardSettings[cardIndex] = {
        border: true,
        boldRulesText: true,
        artist: true,
        credits: true,
        placeholderImage: true,
        cardBack: card.cardPreview.cardBack || 'default',
        customCardBackLogo: card.cardPreview.customCardBackLogo,
      };
      setCardSettings(newCardSettings);
    }
    
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

  const exportAsPDF = async () => {
    try {
      // Wait longer to ensure all images are loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Preload all images to ensure they're ready
      const imageUrls = [
        '/assets/images/quill-icon.png',
        '/assets/images/dh-cgl-logo.png',
        '/assets/card/banner.webp',
        '/assets/card/level-bg.webp',
        '/assets/card/dh-armor-bg.webp',
        '/assets/card/dh-one-hand.webp',
        '/assets/card/dh-two-hands.webp',
        '/assets/card/dh-card-back-1.webp',
        '/assets/card/dh-card-back-2.webp'
      ];
      
      // Add divider images
      const cardTypes = ['domain', 'class', 'subclass', 'ancestry', 'community', 'equipment', 'transformation'];
      cardTypes.forEach(type => {
        imageUrls.push(`/assets/card/divider-${type === 'subclass' ? 'class' : type}.webp`);
      });
      
      // Preload all images
      await Promise.all(imageUrls.map(url => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      }));
      
      // Preload custom card images and logos
      const customImages = selectedCards
        .filter(card => card?.cardPreview)
        .flatMap(card => [
          card?.cardPreview?.image,
          card?.cardPreview?.customCardBackLogo,
          card?.cardPreview?.domainPrimaryIcon,
          card?.cardPreview?.domainSecondaryIcon
        ])
        .filter(Boolean);
      
      if (customImages.length > 0) {
        await Promise.all(customImages.map(url => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url as string;
          });
        }));
      }
      
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions: 210mm x 297mm
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Card dimensions: 63.5mm x 88.9mm
      const cardWidth = 63.5;
      const cardHeight = 88.9;
      
      // Calculate positions for 2x2 grid with safe margins
      const margin = 20; // Safe margin for printers
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      
      // Calculate spacing between cards
      const horizontalSpacing = (availableWidth - (2 * cardWidth)) / 3;
      const verticalSpacing = (availableHeight - (2 * cardHeight)) / 3;
      
      // Calculate card positions
      const cardPositions = [
        { x: margin + horizontalSpacing, y: margin + verticalSpacing },
        { x: margin + horizontalSpacing + cardWidth + horizontalSpacing, y: margin + verticalSpacing },
        { x: margin + horizontalSpacing, y: margin + verticalSpacing + cardHeight + verticalSpacing },
        { x: margin + horizontalSpacing + cardWidth + horizontalSpacing, y: margin + verticalSpacing + cardHeight + verticalSpacing }
      ];

      // Generate front page (first page is created automatically)
      pdf.setFontSize(12);
      pdf.text('Page 1 - Front', pageWidth / 2, 15, { align: 'center' });

      for (let i = 0; i < 4; i++) {
        if (selectedCards[i]?.cardPreview) {
          // Find the existing card preview element in the DOM
          const cardContainer = document.querySelector(`[data-card-index="${i}"]`);
          const existingCardElement = cardContainer?.querySelector('.scale-75');
          
          
          if (existingCardElement) {
            // Convert to PNG using the existing rendered element
            const pngDataUrl = await toPng(existingCardElement as HTMLElement, {
              cacheBust: true,
              pixelRatio: 2.2,
              width: 340,
              height: 476,
              includeQueryParams: true,
              skipFonts: false,
              skipAutoScale: false,
              backgroundColor: '#ffffff'
            });

            // Add image to PDF
            pdf.addImage(pngDataUrl, 'PNG', cardPositions[i].x, cardPositions[i].y, cardWidth, cardHeight);
          }
        }
      }

      // Generate back page
      pdf.addPage();
      pdf.text('Page 2 - Back', pageWidth / 2, 15, { align: 'center' });

      // For duplex printing, swap positions: 1↔2 and 3↔4
      const duplexPositions = [
        cardPositions[1], // Back 1 goes to position 2
        cardPositions[0], // Back 2 goes to position 1
        cardPositions[3], // Back 3 goes to position 4
        cardPositions[2]  // Back 4 goes to position 3
      ];

      for (let i = 0; i < 4; i++) {
        if (selectedCards[i]?.cardPreview) {
          // Find the existing card back preview element in the DOM
          const cardBackContainer = document.querySelector(`[data-card-back-index="${i}"]`);
          const existingCardElement = cardBackContainer?.querySelector('.scale-75');
          
          
          if (existingCardElement) {
            // Convert to PNG using the existing rendered element
            const pngDataUrl = await toPng(existingCardElement as HTMLElement, {
              cacheBust: true,
              pixelRatio: 2.2,
              width: 340,
              height: 476,
              includeQueryParams: true,
              skipFonts: false,
              skipAutoScale: false,
              backgroundColor: '#ffffff'
            });

            // Add image to PDF using duplex positions
            pdf.addImage(pngDataUrl, 'PNG', duplexPositions[i].x, duplexPositions[i].y, cardWidth, cardHeight);
          }
        }
      }

      // Save the PDF
      pdf.save('daggerheart-cards-print.pdf');
    } catch (error) {
      console.error('Error creating PDF:', error);
    }
  };

  if (showCardPreview) {
    return (
      <div>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='font-eveleth-clean text-2xl font-bold'>Print Preview - Cards</h1>
          <div className='flex gap-2'>
            <Button
              onClick={exportAsPDF}
              className='flex items-center gap-2'
            >
              <FileText className='h-4 w-4' />
              Export as PDF
            </Button>
            <Button 
              variant='outline' 
              onClick={() => setShowCardPreview(false)}
            >
              Back to Options
            </Button>
          </div>
        </div>
        
        <div className='space-y-8'>
          {/* Page 1 - Front of cards */}
          <div className='mx-auto max-w-[210mm] bg-white p-4 shadow-lg' style={{ aspectRatio: '210/297' }}>
            <div className='mb-2 text-center text-sm font-medium text-gray-600'>Page 1 - Front</div>
            <div className='grid h-full grid-cols-2 grid-rows-2 gap-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div 
                  key={`front-${index}`}
                  data-card-index={index}
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
                  data-card-back-index={index}
                  className='border-2 border-dashed border-gray-300 bg-gray-50'
                >
                  <div className='flex h-full items-center justify-center p-2'>
                    {selectedCards[index]?.cardPreview ? (
                      <div className='scale-75 origin-center'>
                        <CardBackPreview
                          card={selectedCards[index]!.cardPreview!}
                          settings={cardSettings[index]}
                        />
                      </div>
                    ) : (
                      <div className='text-sm text-gray-500'>Card {index + 1} Back</div>
                    )}
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
