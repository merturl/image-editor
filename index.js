import { glob } from "glob";
import path from "path";
import fs from "fs";
import sharp from "sharp";
// 스프라이트 시트 폴더 경로 패턴
const spriteSheetPattern = "spritesheets/**/*/move.png";
const images = await glob(spriteSheetPattern, { ignore: "node_modules/**" });

for (const image of images) {
  if (path.basename(image) === "move.png") {
    const idleFilePath = path.join(path.dirname(image), `idle.png`);
    if (!fs.existsSync(idleFilePath)) {
      sharp(image)
        .extract({ left: 0, top: 0, width: 64, height: 64 * 4 })
        .toFile(idleFilePath, (err) => {
          if (err) {
            console.error("이미지 자르기 오류:", err);
          } else {
            console.log(
              `'${image}' 파일에서 '${idleFilePath}'로 이미지 자르기 완료`
            );
          }
        });
    }
  }
}
