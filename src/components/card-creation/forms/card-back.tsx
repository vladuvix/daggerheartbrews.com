'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCardActions, useCardStore } from '@/store';
import { FormContainer } from '@/components/common/form';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { UploadIcon, X } from 'lucide-react';
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload';
import { fileToBase64 } from '@/lib/utils';

export const CardBackForm = () => {
  const { settings } = useCardStore();
  const { setSettings } = useCardActions();
  const [imageError, setImageError] = useState(false);
  const [{ files }, { removeFile, openFileDialog, getInputProps }] = useFileUpload({ accept: 'image/*' });
  const [file] = files;
  const [existingLogoPreview, setExistingLogoPreview] = useState<string | null>(null);

  // Handle logo upload for custom card back
  useEffect(() => {
    if (settings.cardBack === 'custom' && file?.preview) {
      fileToBase64(file.file as File).then((data) => {
        setSettings({ customCardBackLogo: data });
      });
    } else if (settings.cardBack === 'custom' && !file) {
      setSettings({ customCardBackLogo: undefined });
    }
  }, [file, settings.cardBack, setSettings]);

  // Load existing logo when editing a card
  useEffect(() => {
    if (settings.cardBack === 'custom' && settings.customCardBackLogo && !file) {
      setExistingLogoPreview(settings.customCardBackLogo);
    } else if (settings.cardBack !== 'custom' || !settings.customCardBackLogo) {
      setExistingLogoPreview(null);
    }
  }, [settings.cardBack, settings.customCardBackLogo, file]);

  return (
    <FormContainer className='w-full' title='Back of the Card' collapsible defaultOpen>
      <CollapsibleContent>
        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Choose the design for the back of your card.
          </p>
          
          <div className='space-y-4'>
            {/* Radio Button Selection */}
            <div className='flex space-x-6'>
              <div className='flex items-center space-x-2'>
                <input
                  type='radio'
                  id='card-back-default'
                  name='cardBack'
                  value='default'
                  checked={settings.cardBack === 'default'}
                  onChange={(e) => setSettings({ cardBack: e.target.value as 'default' | 'custom' })}
                  className='h-4 w-4'
                />
                <label htmlFor='card-back-default' className='cursor-pointer font-medium'>
                  Default
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <input
                  type='radio'
                  id='card-back-custom'
                  name='cardBack'
                  value='custom'
                  checked={settings.cardBack === 'custom'}
                  onChange={(e) => setSettings({ cardBack: e.target.value as 'default' | 'custom' })}
                  className='h-4 w-4'
                />
                <label htmlFor='card-back-custom' className='cursor-pointer font-medium'>
                  Custom
                </label>
              </div>
            </div>

            {/* Logo Upload - Only for Custom */}
            {settings.cardBack === 'custom' && (
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Custom Logo (Optional)</label>
                <div className='flex flex-col gap-2'>
                  <Button
                    variant='outline'
                    className='h-10 bg-white'
                    onClick={openFileDialog}
                  >
                    <UploadIcon className='size-3' />
                    Add Logo
                  </Button>
                  <input
                    {...getInputProps()}
                    className='sr-only'
                    aria-label='Upload logo file'
                    tabIndex={-1}
                  />
                  {file ? (
                    <div className='dark:bg-input/30 flex items-center justify-between gap-2 rounded-md border bg-white p-2'>
                      <div className='flex items-center gap-4 overflow-hidden'>
                        <div className='bg-accent aspect-square shrink-0 rounded'>
                          <img
                            className='size-10 rounded-[inherit] object-cover'
                            src={file.preview}
                            alt={file.file.name}
                          />
                        </div>
                        <div>
                          <p className='truncate text-sm font-medium'>{file.file.name}</p>
                          <p className='text-muted-foreground text-sm'>
                            {formatBytes(file.file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => removeFile(file.id)}
                        aria-label='Remove file'
                      >
                        <X aria-hidden='true' />
                      </Button>
                    </div>
                  ) : existingLogoPreview ? (
                    <div className='dark:bg-input/30 flex items-center justify-between gap-2 rounded-md border bg-white p-2'>
                      <div className='flex items-center gap-4 overflow-hidden'>
                        <div className='bg-accent aspect-square shrink-0 rounded'>
                          <img
                            className='size-10 rounded-[inherit] object-cover'
                            src={existingLogoPreview}
                            alt='Existing logo'
                          />
                        </div>
                        <div>
                          <p className='truncate text-sm font-medium'>Existing logo</p>
                          <p className='text-muted-foreground text-sm'>
                            Previously uploaded
                          </p>
                        </div>
                      </div>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => {
                          setSettings({ customCardBackLogo: undefined });
                          setExistingLogoPreview(null);
                        }}
                        aria-label='Remove existing logo'
                      >
                        <X aria-hidden='true' />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Card Back Preview - Shows only selected option */}
            <div className='flex justify-center'>
              <div className='w-[170px] aspect-[2/3] overflow-hidden rounded border bg-gray-100 relative'>
                {!imageError ? (
                  <>
                    {/* Background Image */}
                    <Image
                      src={settings.cardBack === 'default' ? '/assets/card/dh-card-back-1.webp' : '/assets/card/dh-card-back-2.webp'}
                      alt={`${settings.cardBack} card back`}
                      width={170}
                      height={255}
                      className='h-full w-full object-cover'
                      onError={() => setImageError(true)}
                    />
                    
                    {/* Overlay Logo for Custom Card Back */}
                    {settings.cardBack === 'custom' && (settings.customCardBackLogo || existingLogoPreview) && (
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div 
                          className='w-[85px] h-[85px] rounded-full overflow-hidden border-2 border-white shadow-lg'
                          style={{ 
                            backgroundImage: `url(${settings.customCardBackLogo || existingLogoPreview})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className='text-center text-gray-500 flex items-center justify-center h-full'>
                    <div>
                      <div className='text-sm font-medium'>{settings.cardBack === 'default' ? 'Default' : 'Custom'} Card Back</div>
                      <div className='text-xs'>dh-card-back-{settings.cardBack === 'default' ? '1' : '2'}.webp</div>
                      <div className='text-xs mt-1'>Add image file to load preview</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </FormContainer>
  );
};
