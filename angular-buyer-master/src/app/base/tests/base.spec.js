describe('Component: Base', function() {
    var productSearch;
    beforeEach(inject(function(ocProducts) {
        productSearch = ocProducts;
    }));
    describe('State: Base', function() {
        var base;
        beforeEach(function() {
            base = state.get('base');
        });
        it('should resolve CurrentUser', function() {
            var user = q.defer();
            user.resolve(mock.User);
            spyOn(oc.Me, 'Get').and.returnValue(user.promise);
            injector.invoke(base.resolve.CurrentUser, scope, {$q:q, $state:state, OrderCloud:oc, buyerid:mock.Buyer.ID});
            expect(oc.Me.Get).toHaveBeenCalled();
            scope.$digest();
        });
        it('should resolve ExistingOrder', function() {
            spyOn(oc.Me, 'ListOrders').and.returnValue(dummyPromise);
            var currentUser = injector.invoke(base.resolve.CurrentUser);
            injector.invoke(base.resolve.ExistingOrder, scope, {$q:q, OrderCloud:oc, CurrentUser:currentUser});
            var options = {
                page: 1,
                pageSize: 1,
                sortBy: '!DateCreated',
                filters: {Status: 'Unsubmitted'}
            };
            expect(oc.Me.ListOrders).toHaveBeenCalledWith(options);
        });
        it('should resolve CurrentOrder - if ExistingOrder is undefined create a new order', inject(function(ocNewOrder) {
            var existingOrder, //undefined existing order
                currentUser = injector.invoke(base.resolve.CurrentUser);
            spyOn(ocNewOrder, 'Create');
            injector.invoke(base.resolve.CurrentOrder, scope, {ExistingOrder: existingOrder, NewOrder: ocNewOrder, CurrentUser: currentUser});
            expect(ocNewOrder.Create).toHaveBeenCalledWith({});
        }));
        it('should resolve TotalQuantity', function(){
            var defer = q.defer();
            defer.resolve(mock.LineItems);
            spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
            injector.invoke(base.resolve.TotalQuantity);
            expect(oc.LineItems.List).toHaveBeenCalledWith('outgoing', mock.Order.ID);
        })
    });

   describe('Controller: BaseCtrl', function(){
        var baseCtrl;
        beforeEach(inject(function($controller) {
            baseCtrl = $controller('BaseCtrl', {
                $scope: scope,
                CurrentUser: mock.User,
                CurrentOrder: mock.Order,
                TotalQuantity: 3
            });
        }));
        it('should initialize the current user and order into its scope', function() {

            expect(baseCtrl.currentUser).toBe(mock.User);
            expect(baseCtrl.currentOrder).toBe(mock.Order);
        });

        describe('mobileSearch', function(){
            beforeEach(function(){
                spyOn(state, 'go');
            });
            it('should go to productDetail if ocProducts.Search() returns a productID', function(){
                var d = q.defer();
                d.resolve({productID: mock.Product.ID});
                spyOn(productSearch, 'Search').and.returnValue(d.promise);
                baseCtrl.mobileSearch();
                scope.$digest();
                expect(productSearch.Search).toHaveBeenCalled();
                expect(state.go).toHaveBeenCalledWith('productDetail', {productid: mock.Product.ID});
            });
            it('should go to productBrowse.products if ocProducts.Search() doesnt return a productID', function(){
                var d = q.defer();
                d.resolve({search: 'SEARCHTERM'});
                spyOn(productSearch, 'Search').and.returnValue(d.promise);
                baseCtrl.mobileSearch();
                scope.$digest();
                expect(productSearch.Search).toHaveBeenCalled();
                expect(state.go).toHaveBeenCalledWith('productBrowse.products', {catalogid: mock.Buyer.DefaultCatalogID, search: 'SEARCHTERM', categoryid:''});
            });
        });
    });
});
