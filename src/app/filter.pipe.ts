import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], searchText: string): any[] {
        if (!items) return [];
        if (!searchText) return items;
        searchText = searchText.toLowerCase();
        return items.filter(it => {
            let found = false;
            for (var property in it) {  /* Match on any in object */
                if (typeof it[property] === 'string' && it.hasOwnProperty(property)) {
                    found = found || it[property].toLowerCase().includes(searchText);
                }
            }
            return found;
        });
    }
}