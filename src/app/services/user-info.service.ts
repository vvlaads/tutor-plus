import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { UserInfo } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  private firestore = inject(Firestore);

  public async addUserInfo(userInfo: UserInfo): Promise<string> {
    await setDoc(doc(this.firestore, 'users', userInfo.id), userInfo);
    return userInfo.id;
  }

  public async updateUserInfo(id: string, changes: Partial<UserInfo>): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', id), changes);
  }

  public async getUserInfoById(id: string): Promise<UserInfo | null> {
    const docSnap = await getDoc(doc(this.firestore, 'users', id));
    return docSnap.exists() ? this.createUserInfo(docSnap) : null;
  }

  private createUserInfo(doc: any): UserInfo {
    const data = doc.data();
    return {
      id: doc.id,
      currentCollection: data.currentCollection
    };
  }
}
