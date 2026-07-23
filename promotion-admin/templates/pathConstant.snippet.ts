/**
 * `src/app/memberPromotion/constants/pathConstant.ts`에 아래 5개 세트를 추가.
 * 기존 다른 도메인 상수들 뒤에 append.
 *
 * 치환 규칙:
 *   {DOMAIN_SNAKE}    = 도메인 SNAKE_CASE 이름  (예: VIP_MEMBERSHIP)
 *   {resource-prefix} = S3 리소스 prefix        (예: member-benefit/vip)
 *   {한글 도메인}      = 한글 라벨               (예: (V)VIP 제도 안내)
 */

/**
 * {한글 도메인}
 */
/** JSON 본문 id 필드 prefix - 컬리몰이 보는 정적 데이터 식별자 */
export const {DOMAIN_SNAKE}_RESOURCE_PREFIX = '{resource-prefix}';

/** S3 업로드 경로 - {한글 도메인} 이미지 디렉토리 */
export const {DOMAIN_SNAKE}_IMAGE_BASE = `images/${{DOMAIN_SNAKE}_RESOURCE_PREFIX}`;

/** S3 업로드 경로 - {한글 도메인} JSON 디렉토리 */
export const {DOMAIN_SNAKE}_JSON_BASE = `json/${{DOMAIN_SNAKE}_RESOURCE_PREFIX}`;

/** S3 업로드 경로 - {한글 도메인} meta.json */
export const {DOMAIN_SNAKE}_JSON_META_PATH = `${{DOMAIN_SNAKE}_JSON_BASE}/meta.json`;

/** S3 조회 경로 - {한글 도메인} JSON 풀 URL */
export const RES_WEB_{DOMAIN_SNAKE}_PATH = `${RES_WEB_BASE}/${{DOMAIN_SNAKE}_JSON_BASE}`;
