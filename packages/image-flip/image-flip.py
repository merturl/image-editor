import cv2
import glob

def flip_image(image):
    for i in range(6):
        x, y, width, height = 0+64*i, 128, 64, 64
        roi = image[y:y+height, x:x+width]
        flipped_roi = cv2.flip(roi, 1)
        image[y:y+flipped_roi.shape[0], x:x+flipped_roi.shape[1]] = flipped_roi
    return image

def remove_grabcut_bg(image):
        tmp = cv2.cvtColor(image,cv2.COLOR_RGB2GRAY)
        _,alpha = cv2.threshold(tmp,0,255,cv2.THRESH_BINARY)
        r, g, b = cv2.split(image)
        rgba = [r,g,b,alpha]
        dst = cv2.merge(rgba,4)
        return dst
        
directory_path = 'spritesheets'
image_pattern = 'slash.png'
image_files = glob.glob(f'{directory_path}/**/{image_pattern}', recursive=True)

for image_file in image_files:
    image = cv2.imread(image_file)
    if image is not None:
        flip_image = flip(image)
        final_image = remove_grabcut_bg(flip_image)
        cv2.imwrite(image_file, final_image)

        print(f"{image_file} 수정 및 저장 완료.")
    else:
        print(f"이미지를 읽어올 수 없습니다: {image_file}")

print(123)