# claude-skills

내가 만든 Claude Code 스킬 모음.

## Skills

| 이름 | 설명 |
|---|---|
| [promotion-admin](./promotion-admin) | LaCMS 회원>프로모션 하위에 새 어드민 페이지 스캐폴딩 (메뉴/라우팅/pathConstant + Query·Form 훅 + 페이지 4종). |

## 사용법

Claude Code에서 스킬을 로드하려면 해당 스킬 폴더를 프로젝트의 `.claude/skills/` 아래에 두거나, 사용자 전역 `~/.claude/skills/`에 두면 됩니다.

```bash
# 프로젝트별 사용
cp -r promotion-admin /path/to/project/.claude/skills/

# 사용자 전역 사용
cp -r promotion-admin ~/.claude/skills/
```

이후 Claude Code에서 `/promotion-admin` 슬래시 커맨드 또는 자연어로 트리거.

## 새 스킬 추가

이 레포에 스킬을 추가할 때는 다음 구조 유지:

```
{skill-name}/
├── SKILL.md          # 스킬 지침 (name/description frontmatter 필수)
├── templates/        # 코드 스켈레톤 (선택)
└── examples/         # 참조 자료 (선택)
```

`SKILL.md` frontmatter 형식:

```yaml
---
name: {skill-name}
description: |
  스킬이 무엇을 하는지.
  Trigger when: 어떤 상황에서 자동 트리거될지.
---
```
