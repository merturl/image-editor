import { glob } from "glob";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

class SpriteSheetExtractor {
  constructor(config = {}) {
    this.targets = config.targets || "spritesheets";
    this.results = config.results || "results";
    this.spriteSheetPattern =
      config.spriteSheetPattern || `${this.targets}/**/*/*.png`;
    this.animations = config.animations || [
      "Idle",
      "Slash",
      "Thrust",
      "Walk",
      "Shoot",
      "Cast",
    ];

    // Default animation areas (can be overridden in constructor)
    this.animationsData = config.animationsData || {
      Cast: { left: 0, top: 0, width: 64 * 7, height: 64 * 4 },
      Thrust: { left: 0, top: 64 * 4, width: 64 * 8, height: 64 * 4 },
      Walk: { left: 0, top: 64 * 8, width: 64 * 9, height: 64 * 4 },
      Idle: { left: 0, top: 64 * 8, width: 64 * 1, height: 64 * 4 },
      Slash: { left: 0, top: 64 * 12, width: 64 * 6, height: 64 * 4 },
      Shoot: { left: 0, top: 64 * 16, width: 64 * 13, height: 64 * 4 },
    };
  }

  async extractSprites() {
    try {
      const images = await glob(this.spriteSheetPattern, {
        ignore: "node_modules/**",
      });

      for (const imagePath of images) {
        await this.processImage(imagePath);
      }
    } catch (error) {
      console.error("Error extracting sprites:", error);
    }
  }

  async processImage(imagePath) {
    const folderPath = path.dirname(imagePath);
    const itemName = path.basename(imagePath);
    const itemParts = itemName.split("/");
    const itemIdentifier = itemParts[itemParts.length - 1].replace(/\D/g, "");

    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    console.log(`Image size: ${metadata.width}x${metadata.height}`);

    // Process each animation
    for (const animation of this.animations) {
      await this.extractAnimationSprite(
        imagePath,
        folderPath,
        animation,
        itemIdentifier,
        metadata
      );
    }
  }

  async extractAnimationSprite(
    imagePath,
    folderPath,
    animation,
    itemIdentifier,
    metadata
  ) {
    const animationArea = this.animationsData[animation];
    const { left, top, width, height } = animationArea;

    // Validate extraction area
    if (left + width > metadata.width || top + height > metadata.height) {
      console.error(
        `Invalid extraction area for ${imagePath}: ${left}, ${top}, ${width}, ${height}`
      );
      return;
    }

    // Construct output file path
    const outputFilePath = path.join(
      folderPath.replace(this.targets, this.results),
      animation,
      `${path
        .basename(folderPath)
        .toLowerCase()}_${animation.toLowerCase()}_${itemIdentifier}.png`
    );

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFilePath), { recursive: true });

    try {
      // Extract the sprite
      const extractedImage = sharp(imagePath)
        .extract({ left, top, width, height })
        .raw(); // Get raw pixel data

      // Check if the extracted image is all black
      const { data, info } = await extractedImage.toBuffer({
        resolveWithObject: true,
      });

      let isBlack = true;
      for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
          isBlack = false;
          break; // Found a non-black pixel
        }
      }

      if (isBlack) {
        console.log(`Skipping black image for ${outputFilePath}`);
        return; // Skip saving this file if it's all black
      }

      // Save the sprite if not black
      if (!(await this.fileExists(outputFilePath))) {
        await sharp(imagePath)
          .extract({ left, top, width, height })
          .toFile(outputFilePath);
        console.log(`Extracted ${outputFilePath}`);
      } else {
        console.log(`File already exists: ${outputFilePath}`);
      }
    } catch (error) {
      console.error(`Error extracting sprite: ${outputFilePath}`, error);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Usage
async function main() {
  const extractor = new SpriteSheetExtractor();
  await extractor.extractSprites();
}

main().catch(console.error);
