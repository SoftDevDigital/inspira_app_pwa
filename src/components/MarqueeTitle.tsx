/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo } from 'react';
import { motion } from 'motion/react';

interface MarqueeTitleProps {
  title: string;
  className: string;
  containerClassName?: string;
  duration?: number;
}

const MarqueeTitle = memo(({ 
  title, 
  className, 
  containerClassName = "", 
  duration = 15,
  as: Tag = 'h4'
}: MarqueeTitleProps & { as?: any }) => {
  return (
    <div className={`overflow-hidden relative mask-edge ${containerClassName} whitespace-nowrap`}>
      <motion.div
        animate={{ x: ["100%", "-100%"] }}
        transition={{ 
          duration: duration, 
          repeat: Infinity, 
          ease: "linear", 
          repeatDelay: 0 
        }}
        className="w-full"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        <Tag className={className}>{title}</Tag>
      </motion.div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .mask-edge {
          mask-image: linear-gradient(to right, black calc(100% - 40px), transparent 100%);
        }
      `}} />
    </div>
  );
});

export default MarqueeTitle;
