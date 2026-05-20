export interface CommentAuthorType {
  username: string;
  bio: string;
  image: string;
}

export interface CommentType {
  id: number;
  body: string;
  likesCount: number;
  liked: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthorType;
  replies: CommentType[];
}

export interface CommentResponseInterface {
  comment: CommentType;
}

export interface CommentsResponseInterface {
  comments: CommentType[];
}
