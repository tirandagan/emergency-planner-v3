import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InteractiveFrostedTestimonial } from './interactive-frosted-glass-card';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = (): React.JSX.Element => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  children?: React.ReactNode;
  showPasswordField?: boolean;
  showRememberMe?: boolean;
  showGoogleButton?: boolean;
  showCreateAccount?: boolean;
  error?: string | null;
  isProcessing?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
  <div className="rounded-2xl border border-border bg-foreground/5 transition-colors focus-within:border-primary/70 focus-within:bg-primary/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tight">Welcome</span>,
  description = "Sign in or create an account to get started",
  heroImageSrc,
  testimonials = [],
  onSubmit,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  children,
  showPasswordField = false,
  showRememberMe = false,
  showGoogleButton = true,
  showCreateAccount = true,
  error,
  isProcessing = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Hero video dynamic scaling logic
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });
  const [containerDims, setContainerDims] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDims({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(container);

    // Initial container dims
    setContainerDims({
      w: container.offsetWidth,
      h: container.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const updateVideoMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoDims({
          w: video.videoWidth,
          h: video.videoHeight,
        });
      }
    };

    if (video.readyState >= 1) { // HAVE_METADATA
      updateVideoMetadata();
    }

    video.addEventListener('loadedmetadata', updateVideoMetadata);
    return () => video.removeEventListener('loadedmetadata', updateVideoMetadata);
  }, []);

  const getDynamicVideoStyle = (): React.CSSProperties => {
    if (!videoDims.w || !videoDims.h || !containerDims.w || !containerDims.h) {
      return { 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0
      };
    }

    // CONTENT_ASPECT_RATIO is the ratio of the "useful" area of the video.
    // Based on the screenshots, the blue map is portrait (approx 9:16).
    const CONTENT_ASPECT_RATIO = 9 / 16;
    
    // We need to find a scale factor that ensures the 'useful' content area 
    // covers the entire container without showing the black bars at the sides.
    
    // Scale needed to cover height: containerHeight / videoHeight
    // Scale needed to cover width with useful content: containerWidth / (videoHeight * CONTENT_ASPECT_RATIO)
    
    const scale = Math.max(
      containerDims.h / videoDims.h,
      containerDims.w / (videoDims.h * CONTENT_ASPECT_RATIO)
    );

    return {
      width: `${videoDims.w * scale}px`,
      height: `${videoDims.h * scale}px`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 'none',
      objectFit: 'fill', // Disable 'cover' since we are managing size manually
      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 -2px 8px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.2)',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
    };
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-[100dvw] bg-slate-200 dark:bg-slate-900 flex items-center justify-center z-50 p-2 sm:p-3">
      <div className="w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Main content area */}
        <div className="flex-1 flex">
          {/* Left column: sign-in form */}
          <section className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12">
            <div className="w-full flex flex-col items-center gap-3">
              {/* Full-width centered title */}
              <div className="w-full flex items-center justify-center animate-element animate-delay-100" style={{ height: '10vh', minHeight: '80px' }}>
                {title}
              </div>
              
              {/* Constrained form content */}
              <div className="w-full max-w-md">
                <div className="flex flex-col gap-6">
                  <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            {error && (
              <div className="animate-element animate-delay-300 bg-destructive/15 text-destructive text-sm p-3 rounded-2xl border border-destructive/20">
                {error}
              </div>
            )}

            {/* Custom form content (passed as children) or default form */}
            {children || (
              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <GlassInputWrapper>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full bg-transparent text-sm p-4 focus:outline-none placeholder:text-muted-foreground/50"
                      disabled={isProcessing}
                      autoComplete="email"
                      autoFocus
                    />
                  </GlassInputWrapper>
                </div>

                {showPasswordField && (
                  <div className="animate-element animate-delay-400">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="w-full bg-transparent text-sm p-4 pr-12 focus:outline-none placeholder:text-muted-foreground/50"
                          disabled={isProcessing}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                          ) : (
                            <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                          )}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>
                )}

                {showRememberMe && (
                  <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0" />
                      <span className="text-foreground/90">Keep me signed in</span>
                    </label>
                    {onResetPassword && (
                      <button
                        type="button"
                        onClick={onResetPassword}
                        className="hover:underline text-primary transition-colors"
                      >
                        Reset password
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Continue'}
                </button>
              </form>
            )}

            {showGoogleButton && (
              <>
                <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                  <span className="w-full border-t border-border"></span>
                  <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
                </div>

                <button
                  onClick={onGoogleSignIn}
                  className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isProcessing}
                >
                  <GoogleIcon />
                  Continue with Google (Coming Soon)
                </button>
              </>
            )}

            {showCreateAccount && onCreateAccount && (
              <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
                New to our platform?{' '}
                <button
                  onClick={onCreateAccount}
                  className="text-primary hover:underline transition-colors font-medium"
                >
                  Create Account
                </button>
              </p>
            )}
              </div>
            </div>
          </div>
        </section>

          {/* Right column: rounded hero image within white frame */}
          {heroImageSrc && (
            <section className="hidden md:block flex-1 p-4 lg:p-6 xl:p-8">
              <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-3xl shadow-xl bg-slate-900">
                <div className="animate-video-fade-in absolute inset-0 w-full h-full overflow-hidden">
                  <video
                    ref={videoRef}
                    style={getDynamicVideoStyle()}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/images/signin-image.png"
                    aria-label="Emergency preparedness hero video"
                  >
                    <source src={heroImageSrc?.endsWith('.mp4') ? heroImageSrc : "/images/signin-video.mp4"} type="video/mp4" />
                    {/* Fallback for browsers that don't support video or if source is not mp4 */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${heroImageSrc && !heroImageSrc.endsWith('.mp4') ? heroImageSrc : "/images/signin-image.png"})` }}
                      role="img"
                      aria-label="Emergency preparedness hero image"
                    />
                  </video>
                </div>
                {testimonials.length > 0 && (
                  <div className="absolute inset-x-0 top-24 flex gap-4 justify-center z-10 pointer-events-none">
                    <InteractiveFrostedTestimonial
                      avatarSrc={testimonials[0].avatarSrc}
                      name={testimonials[0].name}
                      handle={testimonials[0].handle}
                      text={testimonials[0].text}
                      delay="animate-delay-1000"
                    />
                    {testimonials[1] && (
                      <div className="hidden xl:flex">
                        <InteractiveFrostedTestimonial
                          avatarSrc={testimonials[1].avatarSrc}
                          name={testimonials[1].name}
                          handle={testimonials[1].handle}
                          text={testimonials[1].text}
                          delay="animate-delay-1200"
                        />
                      </div>
                    )}
                    {testimonials[2] && (
                      <div className="hidden 2xl:flex">
                        <InteractiveFrostedTestimonial
                          avatarSrc={testimonials[2].avatarSrc}
                          name={testimonials[2].name}
                          handle={testimonials[2].handle}
                          text={testimonials[2].text}
                          delay="animate-delay-1400"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
